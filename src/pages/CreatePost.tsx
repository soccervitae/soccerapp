import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useDeviceCamera } from "@/hooks/useDeviceCamera";
import { useDeviceGallery } from "@/hooks/useDeviceGallery";
import { VideoRecorder } from "@/components/feed/VideoRecorder";
import { PhotoFilterEditor } from "@/components/feed/PhotoFilterEditor";
import { PhotoCropEditor } from "@/components/feed/PhotoCropEditor";
import { LocationPicker } from "@/components/feed/LocationPicker";
import { useUploadMedia } from "@/hooks/useUploadMedia";
import { useCreatePost } from "@/hooks/usePosts";
import { useImageCompression } from "@/hooks/useImageCompression";
import { SortablePhotoThumbnails } from "@/components/feed/SortablePhotoThumbnails";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  ImageFilters,
  applyFiltersToBlob,
  areFiltersDefault,
  getCSSFilterWithFade,
} from "@/hooks/useImageFilters";
import { CropData, getCroppedImg } from "@/hooks/useImageCrop";
import { PhotoTagEditor } from "@/components/feed/PhotoTagEditor";
import { PhotoTag, useCreatePostTags } from "@/hooks/usePostTags";
import { supabase } from "@/integrations/supabase/client";
import { MusicPicker } from "@/components/feed/MusicPicker";
import { SelectedMusicWithTrim, formatDuration } from "@/hooks/useMusic";
import { SchedulePostPicker } from "@/components/feed/SchedulePostPicker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ModerationInfoSheet } from "@/components/feed/ModerationInfoSheet";

type MediaType = "photo" | "video";
type ViewMode = "default" | "video-recorder" | "photo-editor" | "photo-crop" | "photo-tag" | "gallery-picker" | "location-picker" | "music-picker" | "schedule-picker";

interface MediaItem {
  url: string;
  blob?: Blob;
  file?: File;
  isLocal: boolean;
  filters?: ImageFilters;
  cropData?: CropData;
  croppedUrl?: string;
  croppedBlob?: Blob;
  tags?: PhotoTag[];
}

interface SelectedLocation {
  name: string;
  lat: number;
  lng: number;
}

const MAX_PHOTOS = 10;

const CreatePost = () => {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const [caption, setCaption] = useState("");
  const [selectedMediaList, setSelectedMediaList] = useState<MediaItem[]>([]);
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>("photo");
  const [viewMode, setViewMode] = useState<ViewMode>("default");
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);

  const { takePhoto, pickMultipleFromGallery, pickVideoFromGallery, isLoading, error } = useDeviceCamera();
  const { 
    media: deviceGallery, 
    loadGallery, 
    loadMore,
    getMediaPath,
    getMediaBlob,
    clearGallery,
    isLoading: isGalleryLoading,
    isLoadingMore,
    hasMore,
    isNative: isGalleryNative 
  } = useDeviceGallery();
  const { uploadMedia, isUploading, progress } = useUploadMedia();
  const { compressImage, isCompressing } = useImageCompression();
  const createPost = useCreatePost();
  const createPostTags = useCreatePostTags();
  const [allTags, setAllTags] = useState<PhotoTag[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [selectedMusic, setSelectedMusic] = useState<SelectedMusicWithTrim | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [showModerationSheet, setShowModerationSheet] = useState(false);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setCurrentIndex(carouselApi.selectedScrollSnap());
    carouselApi.on("select", onSelect);
    return () => { carouselApi.off("select", onSelect); };
  }, [carouselApi]);

  const handlePickFromGallery = async () => {
    if (isGalleryNative) {
      await loadGallery({ type: 'image', limit: 50 });
      setViewMode("gallery-picker");
      return;
    }
    
    const images = await pickMultipleFromGallery(MAX_PHOTOS);
    if (images.length > 0) {
      const mediaItems: MediaItem[] = images
        .filter((img) => img.webPath)
        .map((img) => ({
          url: img.webPath!,
          blob: img.blob,
          isLocal: true,
        }));
      setSelectedMediaList(mediaItems);
      setSelectedMediaType("photo");
      setCurrentIndex(0);
      toast.success(`${mediaItems.length} foto${mediaItems.length > 1 ? "s" : ""} selecionada${mediaItems.length > 1 ? "s" : ""}!`);
    }
  };

  const handleGallerySelect = async (galleryItem: { id: string; thumbnail: string; webPath: string; type: 'image' | 'video' }) => {
    if (selectedMediaList.length >= MAX_PHOTOS) {
      toast.error(`Máximo de ${MAX_PHOTOS} fotos atingido`);
      return;
    }

    let mediaUrl = galleryItem.webPath;
    const fullPath = await getMediaPath(galleryItem.id);
    if (fullPath) {
      mediaUrl = fullPath;
    }

    const blob = await getMediaBlob(galleryItem.id);

    setSelectedMediaList((prev) => [...prev, { url: mediaUrl, blob: blob || undefined, isLocal: true }]);
    setSelectedMediaType("photo");
  };

  const handleGalleryDone = () => {
    if (selectedMediaList.length > 0) {
      setViewMode("default");
      clearGallery();
      toast.success(`${selectedMediaList.length} foto${selectedMediaList.length > 1 ? "s" : ""} selecionada${selectedMediaList.length > 1 ? "s" : ""}!`);
    } else {
      toast.error("Selecione pelo menos uma foto");
    }
  };

  const handleAddMorePhotos = async () => {
    const remaining = MAX_PHOTOS - selectedMediaList.length;
    if (remaining <= 0) { toast.error(`Máximo de ${MAX_PHOTOS} fotos atingido`); return; }
    const images = await pickMultipleFromGallery(remaining);
    if (images.length > 0) {
      const mediaItems: MediaItem[] = images
        .filter((img) => img.webPath)
        .map((img) => ({
          url: img.webPath!,
          blob: img.blob,
          isLocal: true,
        }));
      setSelectedMediaList((prev) => [...prev, ...mediaItems]);
      toast.success(`${mediaItems.length} foto${mediaItems.length > 1 ? "s" : ""} adicionada${mediaItems.length > 1 ? "s" : ""}!`);
    }
  };

  const handleTakePhoto = async () => {
    const photo = await takePhoto();
    if (photo?.webPath) {
      setSelectedMediaList((prev) => {
        if (prev.length >= MAX_PHOTOS) { toast.error(`Máximo de ${MAX_PHOTOS} fotos atingido`); return prev; }
        return [...prev, { url: photo.webPath, blob: photo.blob, isLocal: true }];
      });
      setSelectedMediaType("photo");
      toast.success("Foto capturada!");
    }
  };

  const handleVideoRecorded = (url: string, blob: Blob) => {
    setSelectedMediaList([{ url, blob, isLocal: true }]);
    setSelectedMediaType("video");
    setViewMode("default");
    toast.success("Vídeo gravado!");
  };

  const handlePickVideoFromGallery = async () => {
    const video = await pickVideoFromGallery();
    if (video) {
      setSelectedMediaList([{ url: video.webPath, blob: video.blob, isLocal: true }]);
      setSelectedMediaType("video");
      toast.success("Vídeo selecionado!");
    }
  };

  const uploadAllMedia = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (let index = 0; index < selectedMediaList.length; index++) {
      const media = selectedMediaList[index];
      let uploadedUrl: string | null = null;
      
      const uniqueFileName = `${Date.now()}_${index}_${Math.random().toString(36).substring(7)}`;
      
      if (media.blob && selectedMediaType === "video") {
        const videoExt = media.blob.type.split('/')[1] || 'mp4';
        uploadedUrl = await uploadMedia(media.blob, "post-media", `${uniqueFileName}.${videoExt}`);
      } else if (media.isLocal && (media.blob || media.croppedBlob || media.url)) {
        try {
          let blob: Blob;
          
          if (media.croppedBlob) {
            blob = media.croppedBlob;
          } else if (media.blob) {
            blob = media.blob;
          } else {
            try {
              const response = await fetch(media.url);
              if (!response.ok) throw new Error('Fetch failed');
              blob = await response.blob();
            } catch (fetchErr) {
              console.error("Failed to fetch image:", fetchErr);
              continue;
            }
          }
          
          if (media.filters && !areFiltersDefault(media.filters)) {
            blob = await applyFiltersToBlob(blob, media.filters);
          }
          
          const compressed = await compressImage(blob);
          uploadedUrl = await uploadMedia(compressed, "post-media", `${uniqueFileName}.jpg`);
        } catch (err) {
          console.error("Error processing/uploading image:", err);
        }
      } else if (media.url && !media.isLocal) {
        uploadedUrl = media.url;
      }
      
      if (uploadedUrl) {
        uploadedUrls.push(uploadedUrl);
      }
    }
    
    return uploadedUrls;
  };

  const handlePost = async () => {
    if (selectedMediaList.length === 0) { 
      toast.error("Selecione uma foto ou vídeo para postar"); 
      return; 
    }

    setIsPublishing(true);
    
    try {
      toast.loading("Enviando mídia...", { id: "upload-progress" });
      
      const uploadedUrls = await uploadAllMedia();
      
      if (uploadedUrls.length === 0) {
        toast.dismiss("upload-progress");
        toast.error("Erro ao fazer upload das mídias");
        return;
      }

      toast.dismiss("upload-progress");
      
      const mediaUrl = uploadedUrls.length === 1 
        ? uploadedUrls[0] 
        : JSON.stringify(uploadedUrls);
      
      const mediaType = selectedMediaType === "video" 
        ? "video" 
        : uploadedUrls.length > 1 
          ? "carousel" 
          : "image";

      const needsModeration = !scheduledDate && (selectedMediaType === "video" || selectedMediaType === "photo");

      const result = await createPost.mutateAsync({
        content: caption || "",
        mediaUrl,
        mediaType,
        locationName: selectedLocation?.name,
        locationLat: selectedLocation?.lat,
        locationLng: selectedLocation?.lng,
        musicTitle: selectedMusic?.track.title,
        musicArtist: selectedMusic?.track.artist,
        musicAudioUrl: selectedMusic?.track.audio_url,
        musicCoverUrl: selectedMusic?.track.cover_url,
        musicDurationSeconds: selectedMusic?.track.duration_seconds,
        musicSource: selectedMusic?.track.source || 'deezer',
        musicStartSeconds: selectedMusic?.startSeconds,
        musicEndSeconds: selectedMusic?.endSeconds,
        scheduledAt: scheduledDate?.toISOString(),
        isPublished: scheduledDate ? false : !needsModeration,
      });

      if (allTags.length > 0 && result?.id) {
        try {
          await createPostTags.mutateAsync({ postId: result.id, tags: allTags });
        } catch (err) {
          console.error("Error saving tags:", err);
        }
      }

      if (needsModeration && result?.id) {
        toast.loading("Analisando conteúdo...", { id: "moderation-progress" });
        
        try {
          const { data, error } = await supabase.functions.invoke('moderate-content', {
            body: {
              postId: result.id,
              mediaUrls: uploadedUrls,
              mediaType: selectedMediaType,
            }
          });

          toast.dismiss("moderation-progress");

          if (error) {
            console.error("Moderation error:", error);
            setShowModerationSheet(true);
          } else if (data?.status === 'approved') {
            toast.success("Post publicado com sucesso!");
            navigate("/");
            window.dispatchEvent(new CustomEvent('home-tab-pressed'));
          } else if (data?.status === 'flagged') {
            setShowModerationSheet(true);
          } else {
            toast.error(data?.reason || "Seu post foi rejeitado por violar as diretrizes da comunidade.");
          }
        } catch (moderationErr) {
          console.error("Moderation call failed:", moderationErr);
          setShowModerationSheet(true);
        }
      } else if (scheduledDate) {
        toast.success("Post agendado com sucesso!");
        navigate("/");
      } else {
        toast.success("Post publicado com sucesso!");
        navigate("/");
        window.dispatchEvent(new CustomEvent('home-tab-pressed'));
      }
    } catch (err) {
      console.error("Error publishing post:", err);
      toast.error("Erro ao publicar post");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleClose = () => {
    if (isPublishing) return;
    navigate(-1);
  };

  const handleLocationConfirm = (location: SelectedLocation) => {
    setSelectedLocation(location);
    setViewMode("default");
    toast.success("Localização adicionada!");
  };

  const handleTagPhoto = (index: number) => {
    setEditingPhotoIndex(index);
    setViewMode("photo-tag");
  };

  const handleApplyTags = (tags: PhotoTag[]) => {
    setAllTags(tags);
    setEditingPhotoIndex(null);
    setViewMode("default");
    toast.success("Marcações aplicadas!");
  };

  const handleEditPhoto = (index: number) => {
    setEditingPhotoIndex(index);
    setViewMode("photo-editor");
  };

  const handleApplyFilters = (filters: ImageFilters) => {
    if (editingPhotoIndex !== null) {
      setSelectedMediaList((prev) =>
        prev.map((item, i) =>
          i === editingPhotoIndex ? { ...item, filters } : item
        )
      );
      toast.success("Filtros aplicados!");
    }
    setEditingPhotoIndex(null);
    setViewMode("default");
  };

  const handleCropPhoto = (index: number) => {
    setEditingPhotoIndex(index);
    setViewMode("photo-crop");
  };

  const handleApplyCrop = async (cropData: CropData) => {
    if (editingPhotoIndex !== null) {
      const media = selectedMediaList[editingPhotoIndex];
      try {
        const croppedBlob = await getCroppedImg(media.url, cropData.croppedAreaPixels);
        const croppedUrl = URL.createObjectURL(croppedBlob);
        
        setSelectedMediaList((prev) =>
          prev.map((item, i) =>
            i === editingPhotoIndex 
              ? { ...item, cropData, croppedUrl, croppedBlob } 
              : item
          )
        );
        toast.success("Recorte aplicado!");
      } catch (err) {
        console.error("Error applying crop:", err);
        toast.error("Erro ao aplicar recorte");
      }
    }
    setEditingPhotoIndex(null);
    setViewMode("default");
  };

  const handleRemoveCurrentMedia = () => {
    if (selectedMediaList.length <= 1) { setSelectedMediaList([]); setCurrentIndex(0); return; }
    setSelectedMediaList((prev) => {
      const newList = prev.filter((_, i) => i !== currentIndex);
      if (currentIndex >= newList.length) { 
        setCurrentIndex(Math.max(0, newList.length - 1)); 
        carouselApi?.scrollTo(Math.max(0, newList.length - 1)); 
      }
      return newList;
    });
  };

  const isButtonDisabled = selectedMediaList.length === 0 || isLoading || isUploading || isCompressing || isPublishing || createPost.isPending;

  // Fullscreen editors
  if (viewMode === "video-recorder") {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <VideoRecorder onVideoRecorded={handleVideoRecorded} onClose={() => setViewMode("default")} />
      </div>
    );
  }

  if (viewMode === "photo-editor" && editingPhotoIndex !== null) {
    const mediaToEdit = selectedMediaList[editingPhotoIndex];
    return (
      <div className="fixed inset-0 bg-black z-50">
        <PhotoFilterEditor
          imageUrl={mediaToEdit.croppedUrl || mediaToEdit.url}
          initialFilters={mediaToEdit.filters}
          onApply={handleApplyFilters}
          onCancel={() => {
            setEditingPhotoIndex(null);
            setViewMode("default");
          }}
        />
      </div>
    );
  }

  if (viewMode === "photo-crop" && editingPhotoIndex !== null) {
    const mediaToEdit = selectedMediaList[editingPhotoIndex];
    return (
      <div className="fixed inset-0 bg-black z-50">
        <PhotoCropEditor
          imageUrl={mediaToEdit.url}
          initialCropData={mediaToEdit.cropData}
          onApply={handleApplyCrop}
          onCancel={() => {
            setEditingPhotoIndex(null);
            setViewMode("default");
          }}
        />
      </div>
    );
  }

  if (viewMode === "photo-tag" && editingPhotoIndex !== null) {
    const mediaToEdit = selectedMediaList[editingPhotoIndex];
    return (
      <div className="fixed inset-0 bg-black z-50">
        <PhotoTagEditor
          imageUrl={mediaToEdit.croppedUrl || mediaToEdit.url}
          photoIndex={editingPhotoIndex}
          initialTags={allTags}
          onApply={handleApplyTags}
          onCancel={() => {
            setEditingPhotoIndex(null);
            setViewMode("default");
          }}
        />
      </div>
    );
  }

  if (viewMode === "location-picker") {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <LocationPicker
          initialLocation={selectedLocation}
          onConfirm={handleLocationConfirm}
          onCancel={() => setViewMode("default")}
        />
      </div>
    );
  }

  if (viewMode === "music-picker") {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <MusicPicker
          selectedMusic={selectedMusic}
          onSelect={setSelectedMusic}
          onClose={() => setViewMode("default")}
          onConfirm={() => {
            setViewMode("default");
            if (selectedMusic) {
              toast.success(`Música "${selectedMusic.track.title}" adicionada!`);
            }
          }}
          maxTrimDuration={30}
        />
      </div>
    );
  }

  if (viewMode === "schedule-picker") {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <SchedulePostPicker
          scheduledDate={scheduledDate}
          onScheduleChange={setScheduledDate}
          onClose={() => setViewMode("default")}
        />
      </div>
    );
  }

  // Gallery picker view
  if (viewMode === "gallery-picker") {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Header - Glassmorphism */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-xl">
          <button 
            onClick={() => {
              setViewMode("default");
              clearGallery();
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-[24px] text-white">close</span>
          </button>
          
          <span className="text-base font-semibold text-white">
            Selecionar Fotos {selectedMediaList.length > 0 && `(${selectedMediaList.length}/${MAX_PHOTOS})`}
          </span>
          
          <Button 
            onClick={handleGalleryDone}
            size="sm"
            className={`rounded-full px-5 font-semibold text-sm transition-all duration-200 ${
              selectedMediaList.length > 0
                ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25' 
                : 'bg-white/10 text-white/40 hover:bg-white/10'
            }`}
            disabled={selectedMediaList.length === 0}
          >
            Concluir
          </Button>
        </div>

        {/* Gallery Grid */}
        <div 
          className="flex-1 overflow-y-auto bg-zinc-950"
          onScroll={(e) => {
            const target = e.currentTarget;
            const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 200;
            if (isNearBottom && hasMore && !isLoadingMore && isGalleryNative) {
              loadMore();
            }
          }}
        >
          {isGalleryLoading ? (
            <div className="w-full h-64 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-sm text-white/60">Carregando galeria...</span>
              </div>
            </div>
          ) : deviceGallery.length === 0 ? (
            <div className="w-full h-64 flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-[48px] text-white/30">photo_library</span>
              <p className="text-sm text-white/60">Nenhuma foto encontrada</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-0.5 p-0.5">
                {deviceGallery.map((item, index) => {
                  const isSelected = selectedMediaList.some(m => m.url === item.webPath);
                  const selectionIndex = selectedMediaList.findIndex(m => m.url === item.webPath) + 1;
                  
                  return (
                    <button
                      key={`${item.id}-${index}`}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedMediaList(prev => prev.filter(m => m.url !== item.webPath));
                        } else {
                          handleGallerySelect(item);
                        }
                      }}
                      className="relative aspect-square overflow-hidden group"
                    >
                      <img
                        src={item.thumbnail.startsWith('data:') ? item.thumbnail : `data:image/jpeg;base64,${item.thumbnail}`}
                        alt={`Gallery ${index + 1}`}
                        className={`w-full h-full object-cover transition-all duration-200 ${
                          isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-black rounded-sm scale-[0.92]' : ''
                        }`}
                      />
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
                      
                      <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        isSelected 
                          ? 'bg-primary border-primary shadow-lg shadow-primary/30' 
                          : 'bg-black/40 border-white/60 backdrop-blur-sm'
                      }`}>
                        {isSelected && (
                          <span className="text-xs font-bold text-white">{selectionIndex}</span>
                        )}
                      </div>

                      {item.type === 'video' && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded">
                          <span className="material-symbols-outlined text-[14px] text-white">play_arrow</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {isLoadingMore && (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!hasMore && deviceGallery.length > 0 && (
                <div className="flex items-center justify-center py-4">
                  <span className="text-xs text-white/40">Fim da galeria</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Default view
  return (
    <>
      <div className="min-h-screen bg-black flex flex-col">
        {/* Header - Glassmorphism */}
        <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleClose} 
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-all duration-200"
              disabled={isPublishing}
            >
              <span className="material-symbols-outlined text-[24px] text-white">close</span>
            </button>
            <span className="text-base font-semibold text-white">Nova Publicação</span>
            <Button 
              onClick={handlePost} 
              size="sm"
              className={`rounded-full px-5 font-semibold text-sm transition-all duration-200 ${
                !isButtonDisabled
                  ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25' 
                  : 'bg-white/10 text-white/40 hover:bg-white/10'
              }`}
              disabled={isButtonDisabled}
            >
              {isPublishing ? (scheduledDate ? "Agendando..." : "Publicando...") : (scheduledDate ? "Agendar" : "Publicar")}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-safe">
          {/* Upload Progress */}
          {isPublishing && (
            <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden mb-4">
              <div 
                className="h-full bg-primary transition-all duration-300" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          )}

          {selectedMediaList.length === 0 ? (
            <div className="w-full aspect-square bg-zinc-900/80 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-6 p-6 backdrop-blur-sm">
              {isLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  <p className="text-sm text-white/60">Carregando...</p>
                </div>
              ) : (
                <>
                  <button onClick={handlePickFromGallery} className="w-full max-w-[200px] flex flex-col items-center gap-3 p-4 rounded-xl bg-zinc-900/80 border border-white/10 hover:border-white/20 transition-all duration-200">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shadow-lg shadow-primary/10">
                      <span className="material-symbols-outlined text-[28px] text-primary">photo_library</span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-white">Escolher da Galeria</p>
                      <p className="text-xs text-white/60 mt-0.5">Selecione até {MAX_PHOTOS} fotos</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-3 w-full max-w-[200px]">
                    <div className="flex-1 h-px bg-white/10" /><span className="text-xs text-white/40">ou</span><div className="flex-1 h-px bg-white/10" />
                  </div>
                  <div className="flex gap-4">
                    <button onClick={handleTakePhoto} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-900/80 border border-white/10 hover:border-white/20 transition-all duration-200">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-600/10 flex items-center justify-center shadow-lg shadow-blue-500/10">
                        <span className="material-symbols-outlined text-[24px] text-blue-400">photo_camera</span>
                      </div>
                      <span className="text-xs font-medium text-white/60">Foto</span>
                    </button>
                    <button onClick={handlePickVideoFromGallery} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-900/80 border border-white/10 hover:border-white/20 transition-all duration-200">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/30 to-purple-600/10 flex items-center justify-center shadow-lg shadow-purple-500/10">
                        <span className="material-symbols-outlined text-[24px] text-purple-400">video_library</span>
                      </div>
                      <span className="text-xs font-medium text-white/60">Vídeo</span>
                    </button>
                    <button onClick={() => setViewMode("video-recorder")} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-900/80 border border-white/10 hover:border-white/20 transition-all duration-200">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500/30 to-red-600/10 flex items-center justify-center shadow-lg shadow-red-500/10">
                        <span className="material-symbols-outlined text-[24px] text-red-400">videocam</span>
                      </div>
                      <span className="text-xs font-medium text-white/60">Gravar</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="relative">
              {selectedMediaType === "video" ? (
                <>
                  <video src={selectedMediaList[0]?.url} controls className="w-full aspect-square object-cover rounded-xl" />
                  <div className="absolute top-2 left-2 px-3 py-1.5 bg-red-500/90 backdrop-blur-sm rounded-full flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-white">videocam</span>
                    <span className="text-xs font-semibold text-white">VÍDEO</span>
                  </div>
                </>
              ) : selectedMediaList.length === 1 ? (
                <img 
                  src={selectedMediaList[0]?.croppedUrl || selectedMediaList[0]?.url} 
                  alt="Preview" 
                  className="w-full aspect-square object-cover rounded-xl" 
                  style={selectedMediaList[0]?.filters ? getCSSFilterWithFade(selectedMediaList[0].filters) : undefined}
                />
              ) : (
                <Carousel setApi={setCarouselApi} className="w-full">
                  <CarouselContent>
                    {selectedMediaList.map((media, index) => (
                      <CarouselItem key={index}>
                        <img 
                          src={media.croppedUrl || media.url} 
                          alt={`Foto ${index + 1}`} 
                          className="w-full aspect-square object-cover rounded-xl" 
                          style={media.filters ? getCSSFilterWithFade(media.filters) : undefined}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              )}
              {selectedMediaList.length > 1 && selectedMediaType === "photo" && (
                <div className="absolute top-2 left-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-white">photo_library</span>
                  <span className="text-xs font-semibold text-white">{currentIndex + 1}/{selectedMediaList.length}</span>
                </div>
              )}
              {selectedMediaType === "photo" && !isPublishing && (
                <>
                  <button 
                    onClick={() => handleCropPhoto(selectedMediaList.length === 1 ? 0 : currentIndex)} 
                    className="absolute top-2 right-[5.5rem] w-9 h-9 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/80 transition-all duration-200"
                    title="Recortar"
                  >
                    <span className="material-symbols-outlined text-[18px] text-white">crop</span>
                  </button>
                  <button 
                    onClick={() => handleEditPhoto(selectedMediaList.length === 1 ? 0 : currentIndex)} 
                    className="absolute top-2 right-12 w-9 h-9 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/80 transition-all duration-200"
                    title="Filtros"
                  >
                    <span className="material-symbols-outlined text-[18px] text-white">auto_fix_high</span>
                  </button>
                </>
              )}
              <button onClick={handleRemoveCurrentMedia} disabled={isPublishing} className="absolute top-2 right-2 w-9 h-9 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/80 transition-all duration-200 disabled:opacity-50">
                <span className="material-symbols-outlined text-[18px] text-white">close</span>
              </button>
              {selectedMediaList.length > 1 && selectedMediaType === "photo" && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {selectedMediaList.map((_, index) => (
                    <button key={index} onClick={() => carouselApi?.scrollTo(index)} className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? "bg-primary w-4" : "bg-white/40"}`} />
                  ))}
                </div>
              )}
              {selectedMediaType === "photo" && !isPublishing && (
                <SortablePhotoThumbnails
                  items={selectedMediaList}
                  onReorder={(newList) => {
                    setSelectedMediaList(newList);
                    toast.success("Ordem das fotos atualizada!");
                  }}
                  currentIndex={currentIndex}
                  onSelect={(index) => {
                    setCurrentIndex(index);
                    carouselApi?.scrollTo(index);
                  }}
                  disabled={isPublishing}
                />
              )}
              {selectedMediaType === "photo" && selectedMediaList.length < MAX_PHOTOS && !isPublishing && (
                <button onClick={handleAddMorePhotos} disabled={isLoading} className="mt-3 w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900/80 border border-white/10 hover:border-white/20 transition-all duration-200 disabled:opacity-50">
                  <span className="material-symbols-outlined text-[20px] text-primary">add_photo_alternate</span>
                  <span className="text-sm font-medium text-white">Adicionar mais fotos ({selectedMediaList.length}/{MAX_PHOTOS})</span>
                </button>
              )}
            </div>
          )}

          {/* Selected Music Display */}
          {selectedMusic && (
            <div className="flex items-center gap-3 p-4 bg-zinc-900/80 backdrop-blur-sm rounded-xl border border-white/10 mt-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center animate-spin flex-shrink-0" style={{ animationDuration: '3s' }}>
                <span className="material-symbols-outlined text-[18px] text-white">album</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{selectedMusic.track.title}</p>
                <p className="text-xs text-white/60 truncate">
                  {selectedMusic.track.artist} · {formatDuration(selectedMusic.startSeconds)} - {formatDuration(selectedMusic.endSeconds)}
                </p>
              </div>
              <button 
                onClick={() => {
                  setSelectedMusic(null);
                  toast.success("Música removida");
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-all duration-200"
              >
                <span className="material-symbols-outlined text-[16px] text-white">close</span>
              </button>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <Avatar className="w-10 h-10 flex-shrink-0 border-2 border-white/20">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || "Usuário"} />
              <AvatarFallback className="bg-zinc-800">
                <span className="material-symbols-outlined text-[18px] text-white/40">person</span>
              </AvatarFallback>
            </Avatar>
            <Textarea 
              placeholder="Escreva uma legenda..." 
              value={caption} 
              onChange={(e) => setCaption(e.target.value)} 
              className="min-h-[100px] resize-none border-0 bg-transparent p-0 text-sm text-white placeholder:text-white/40 focus-visible:ring-0" 
              disabled={isPublishing}
              autoFocus={false}
            />
          </div>

          <div className="border-t border-white/10 pt-4 mt-4 space-y-1">
            <button 
              onClick={() => setViewMode("location-picker")}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-900/80 transition-all duration-200" 
              disabled={isPublishing}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-white">location_on</span>
                <div className="flex flex-col items-start">
                  <span className="text-sm text-white">
                    {selectedLocation ? selectedLocation.name : "Adicionar localização"}
                  </span>
                  {selectedLocation && (
                    <span className="text-xs text-white/60">Toque para alterar</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedLocation && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLocation(null);
                      toast.success("Localização removida");
                    }}
                    className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[16px] text-white/60">close</span>
                  </button>
                )}
                <span className="material-symbols-outlined text-[20px] text-white/40">chevron_right</span>
              </div>
            </button>
            <button 
              onClick={() => selectedMediaType === "photo" && selectedMediaList.length > 0 && handleTagPhoto(selectedMediaList.length === 1 ? 0 : currentIndex)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-900/80 transition-all duration-200" 
              disabled={isPublishing || selectedMediaType !== "photo" || selectedMediaList.length === 0}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-white">person_add</span>
                <span className="text-sm text-white">
                  Marcar pessoas {allTags.length > 0 && `(${allTags.length})`}
                </span>
              </div>
              <span className="material-symbols-outlined text-[20px] text-white/40">chevron_right</span>
            </button>
            <button 
              onClick={() => setViewMode("music-picker")}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-900/80 transition-all duration-200" 
              disabled={isPublishing}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-white">music_note</span>
                <div className="flex flex-col items-start">
                  <span className="text-sm text-white">
                    {selectedMusic ? selectedMusic.track.title : "Adicionar música"}
                  </span>
                  {selectedMusic && (
                    <span className="text-xs text-white/60">
                      {selectedMusic.track.artist} · {formatDuration(selectedMusic.startSeconds)} - {formatDuration(selectedMusic.endSeconds)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedMusic && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMusic(null);
                      toast.success("Música removida");
                    }}
                    className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[16px] text-white/60">close</span>
                  </button>
                )}
                <span className="material-symbols-outlined text-[20px] text-white/40">chevron_right</span>
              </div>
            </button>
            <button 
              onClick={() => setViewMode("schedule-picker")}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-900/80 transition-all duration-200" 
              disabled={isPublishing}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-white">schedule</span>
                <div className="flex flex-col items-start">
                  <span className="text-sm text-white">
                    {scheduledDate ? "Agendado para" : "Agendar publicação"}
                  </span>
                  {scheduledDate && (
                    <span className="text-xs text-white/60">
                      {format(scheduledDate, "dd MMM yyyy, HH:mm", { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {scheduledDate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setScheduledDate(null);
                      toast.success("Agendamento removido");
                    }}
                    className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[16px] text-white/60">close</span>
                  </button>
                )}
                <span className="material-symbols-outlined text-[20px] text-white/40">chevron_right</span>
              </div>
            </button>
          </div>
        </div>
      </div>
      
      <ModerationInfoSheet open={showModerationSheet} onOpenChange={setShowModerationSheet} />
    </>
  );
};

export default CreatePost;
