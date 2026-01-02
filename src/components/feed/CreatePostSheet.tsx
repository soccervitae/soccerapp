import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsPWA } from "@/hooks/useIsPWA";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
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

interface CreatePostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type MediaType = "photo" | "video";
type ViewMode = "default" | "video-recorder" | "photo-editor" | "photo-crop" | "photo-tag" | "gallery-picker" | "location-picker" | "music-picker";

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

export const CreatePostSheet = ({ open, onOpenChange }: CreatePostSheetProps) => {
  const isMobile = useIsMobile();
  const isPWA = useIsPWA();
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
      
      // Gerar nome único com timestamp + índice + random
      const uniqueFileName = `${Date.now()}_${index}_${Math.random().toString(36).substring(7)}`;
      
      if (media.blob && selectedMediaType === "video") {
        // Detectar extensão do vídeo original
        const videoExt = media.blob.type.split('/')[1] || 'mp4';
        uploadedUrl = await uploadMedia(media.blob, "post-media", `${uniqueFileName}.${videoExt}`);
      } else if (media.isLocal && (media.blob || media.croppedBlob || media.url)) {
        try {
          let blob: Blob;
          
          // Usar o blob recortado se existir, em vez de refazer o crop
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

      const result = await createPost.mutateAsync({
        content: caption || "",
        mediaUrl,
        mediaType,
        locationName: selectedLocation?.name,
        locationLat: selectedLocation?.lat,
        locationLng: selectedLocation?.lng,
        musicTrackId: selectedMusic?.track.id,
        musicStartSeconds: selectedMusic?.startSeconds,
        musicEndSeconds: selectedMusic?.endSeconds,
      });

      if (allTags.length > 0 && result?.id) {
        try {
          await createPostTags.mutateAsync({ postId: result.id, tags: allTags });
        } catch (err) {
          console.error("Error saving tags:", err);
        }
      }

      setCaption("");
      setSelectedMediaList([]);
      setSelectedMediaType("photo");
      setCurrentIndex(0);
      setAllTags([]);
      setSelectedLocation(null);
      setSelectedMusic(null);
      onOpenChange(false);
    } catch (err) {
      console.error("Error publishing post:", err);
      toast.error("Erro ao publicar post");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleClose = () => {
    if (isPublishing) return;
    setCaption("");
    setSelectedMediaList([]);
    setSelectedMediaType("photo");
    setViewMode("default");
    setCurrentIndex(0);
    setEditingPhotoIndex(null);
    setAllTags([]);
    setSelectedLocation(null);
    setSelectedMusic(null);
    clearGallery();
    onOpenChange(false);
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

  // Fullscreen views for editors
  const renderFullscreenContent = () => {
    if (viewMode === "video-recorder") {
      return (
        <VideoRecorder onVideoRecorded={(videoUrl, blob) => handleVideoRecorded(videoUrl, blob)} onClose={() => setViewMode("default")} />
      );
    }

    if (viewMode === "photo-editor" && editingPhotoIndex !== null) {
      const mediaToEdit = selectedMediaList[editingPhotoIndex];
      return (
        <PhotoFilterEditor
          imageUrl={mediaToEdit.croppedUrl || mediaToEdit.url}
          initialFilters={mediaToEdit.filters}
          onApply={handleApplyFilters}
          onCancel={() => {
            setEditingPhotoIndex(null);
            setViewMode("default");
          }}
        />
      );
    }

    if (viewMode === "photo-crop" && editingPhotoIndex !== null) {
      const mediaToEdit = selectedMediaList[editingPhotoIndex];
      return (
        <PhotoCropEditor
          imageUrl={mediaToEdit.url}
          initialCropData={mediaToEdit.cropData}
          onApply={handleApplyCrop}
          onCancel={() => {
            setEditingPhotoIndex(null);
            setViewMode("default");
          }}
        />
      );
    }

    if (viewMode === "photo-tag" && editingPhotoIndex !== null) {
      const mediaToEdit = selectedMediaList[editingPhotoIndex];
      return (
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
      );
    }

    if (viewMode === "location-picker") {
      return (
        <LocationPicker
          initialLocation={selectedLocation}
          onConfirm={handleLocationConfirm}
          onCancel={() => setViewMode("default")}
        />
      );
    }

    if (viewMode === "music-picker") {
      return (
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
      );
    }

    return null;
  };

  const fullscreenContent = renderFullscreenContent();
  if (fullscreenContent) {
    if (isMobile) {
      return (
        <Drawer open={open} onOpenChange={handleClose}>
          <DrawerContent className="h-full rounded-t-none p-0">
            {fullscreenContent}
          </DrawerContent>
        </Drawer>
      );
    }
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden">
          {fullscreenContent}
        </DialogContent>
      </Dialog>
    );
  }

  // Gallery picker view
  if (viewMode === "gallery-picker") {
    const galleryContent = (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button 
            onClick={() => {
              setViewMode("default");
              clearGallery();
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <span className="material-symbols-outlined text-[24px] text-foreground">close</span>
          </button>
          
          <span className="text-base font-semibold text-foreground">
            Selecionar Fotos {selectedMediaList.length > 0 && `(${selectedMediaList.length}/${MAX_PHOTOS})`}
          </span>
          
          <Button 
            onClick={handleGalleryDone}
            size="sm"
            variant="ghost"
            className="text-primary font-semibold text-sm hover:bg-transparent"
            disabled={selectedMediaList.length === 0}
          >
            Concluir
          </Button>
        </div>

        {/* Gallery Grid */}
        <div 
          className="flex-1 overflow-y-auto p-1"
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
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Carregando galeria...</span>
              </div>
            </div>
          ) : deviceGallery.length === 0 ? (
            <div className="w-full h-64 flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-[48px] text-muted-foreground">photo_library</span>
              <p className="text-sm text-muted-foreground">Nenhuma foto encontrada</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-0.5">
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
                      className="relative aspect-square overflow-hidden"
                    >
                      <img
                        src={item.thumbnail.startsWith('data:') ? item.thumbnail : `data:image/jpeg;base64,${item.thumbnail}`}
                        alt={`Gallery ${index + 1}`}
                        className={`w-full h-full object-cover transition-all duration-200 ${
                          isSelected ? 'scale-90 rounded-lg' : ''
                        }`}
                      />
                      
                      <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected 
                          ? 'bg-primary border-primary' 
                          : 'bg-black/30 border-white/70'
                      }`}>
                        {isSelected && (
                          <span className="text-xs font-bold text-primary-foreground">{selectionIndex}</span>
                        )}
                      </div>

                      {item.type === 'video' && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded">
                          <span className="material-symbols-outlined text-[14px] text-white">play_arrow</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {isLoadingMore && (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!hasMore && deviceGallery.length > 0 && (
                <div className="flex items-center justify-center py-4">
                  <span className="text-xs text-muted-foreground">Fim da galeria</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );

    if (isMobile) {
      return (
        <Drawer open={open} onOpenChange={handleClose}>
          <DrawerContent className="h-[95vh] p-0">
            {galleryContent}
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl h-[85vh] p-0 overflow-hidden">
          {galleryContent}
        </DialogContent>
      </Dialog>
    );
  }

  // Default view
  const defaultContent = (
    <div className="h-full flex flex-col">
      <div className="pb-4 border-b border-border px-4 pt-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleClose} 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            disabled={isPublishing}
          >
            Cancelar
          </button>
          <span className="text-base font-bold">Nova Publicação</span>
          <button 
            onClick={handlePost} 
            className={`text-sm font-semibold transition-colors ${
              isButtonDisabled 
                ? "text-muted-foreground cursor-not-allowed" 
                : "text-primary hover:text-primary/80"
            }`}
            disabled={isButtonDisabled}
          >
            {isPublishing ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 mt-4 flex-1 overflow-y-auto pb-4">
        {/* Upload Progress */}
        {isPublishing && (
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        )}

        {selectedMediaList.length === 0 ? (
          <div className="w-full aspect-square bg-muted rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-6 p-6">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Carregando...</p>
              </div>
            ) : (
              <>
                <button onClick={handlePickFromGallery} className="w-full max-w-[200px] flex flex-col items-center gap-3 p-4 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[28px] text-primary">photo_library</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Escolher da Galeria</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Selecione até {MAX_PHOTOS} fotos</p>
                  </div>
                </button>
                <div className="flex items-center gap-3 w-full max-w-[200px]">
                  <div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">ou</span><div className="flex-1 h-px bg-border" />
                </div>
                <div className="flex gap-4">
                  <button onClick={handleTakePhoto} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><span className="material-symbols-outlined text-[24px] text-foreground">photo_camera</span></div>
                    <span className="text-xs font-medium text-foreground">Tirar Foto</span>
                  </button>
                  <button onClick={handlePickVideoFromGallery} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><span className="material-symbols-outlined text-[24px] text-foreground">video_library</span></div>
                    <span className="text-xs font-medium text-foreground">Vídeo Galeria</span>
                  </button>
                  <button onClick={() => setViewMode("video-recorder")} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><span className="material-symbols-outlined text-[24px] text-foreground">videocam</span></div>
                    <span className="text-xs font-medium text-foreground">Gravar Vídeo</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="relative">
            {selectedMediaType === "video" ? (
              <>
                <video src={selectedMediaList[0]?.url} controls className="w-full aspect-square object-cover rounded-lg" />
                <div className="absolute top-2 left-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-foreground">videocam</span>
                  <span className="text-xs font-medium text-foreground">VÍDEO</span>
                </div>
              </>
            ) : selectedMediaList.length === 1 ? (
              <img 
                src={selectedMediaList[0]?.croppedUrl || selectedMediaList[0]?.url} 
                alt="Preview" 
                className="w-full aspect-square object-cover rounded-lg" 
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
                        className="w-full aspect-square object-cover rounded-lg" 
                        style={media.filters ? getCSSFilterWithFade(media.filters) : undefined}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            )}
            {selectedMediaList.length > 1 && selectedMediaType === "photo" && (
              <div className="absolute top-2 left-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-foreground">photo_library</span>
                <span className="text-xs font-medium text-foreground">{currentIndex + 1}/{selectedMediaList.length}</span>
              </div>
            )}
            {selectedMediaType === "photo" && !isPublishing && (
              <>
                <button 
                  onClick={() => handleCropPhoto(selectedMediaList.length === 1 ? 0 : currentIndex)} 
                  className="absolute top-2 right-[5.5rem] w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors"
                  title="Recortar"
                >
                  <span className="material-symbols-outlined text-[18px] text-foreground">crop</span>
                </button>
                <button 
                  onClick={() => handleEditPhoto(selectedMediaList.length === 1 ? 0 : currentIndex)} 
                  className="absolute top-2 right-12 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors"
                  title="Filtros"
                >
                  <span className="material-symbols-outlined text-[18px] text-foreground">auto_fix_high</span>
                </button>
              </>
            )}
            <button onClick={handleRemoveCurrentMedia} disabled={isPublishing} className="absolute top-2 right-2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors disabled:opacity-50">
              <span className="material-symbols-outlined text-[18px] text-foreground">close</span>
            </button>
            {selectedMediaList.length > 1 && selectedMediaType === "photo" && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {selectedMediaList.map((_, index) => (
                  <button key={index} onClick={() => carouselApi?.scrollTo(index)} className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? "bg-primary w-4" : "bg-background/60"}`} />
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
              <button onClick={handleAddMorePhotos} disabled={isLoading} className="mt-3 w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50">
                <span className="material-symbols-outlined text-[20px] text-foreground">add_photo_alternate</span>
                <span className="text-sm font-medium text-foreground">Adicionar mais fotos ({selectedMediaList.length}/{MAX_PHOTOS})</span>
              </button>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || "Usuário"} />
            <AvatarFallback className="bg-muted">
              <span className="material-symbols-outlined text-[18px] text-muted-foreground">person</span>
            </AvatarFallback>
          </Avatar>
          <Textarea 
            placeholder="Escreva uma legenda..." 
            value={caption} 
            onChange={(e) => setCaption(e.target.value)} 
            className="min-h-[100px] resize-none border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0" 
            disabled={isPublishing}
            autoFocus={false}
          />
        </div>

        <div className="border-t border-border pt-4 space-y-1">
          <button 
            onClick={() => setViewMode("location-picker")}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors" 
            disabled={isPublishing}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[22px] text-foreground">location_on</span>
              <div className="flex flex-col items-start">
                <span className="text-sm text-foreground">
                  {selectedLocation ? selectedLocation.name : "Adicionar localização"}
                </span>
                {selectedLocation && (
                  <span className="text-xs text-muted-foreground">Toque para alterar</span>
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
                  className="w-6 h-6 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[16px] text-muted-foreground">close</span>
                </button>
              )}
              <span className="material-symbols-outlined text-[20px] text-muted-foreground">chevron_right</span>
            </div>
          </button>
          <button 
            onClick={() => selectedMediaType === "photo" && selectedMediaList.length > 0 && handleTagPhoto(selectedMediaList.length === 1 ? 0 : currentIndex)}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors" 
            disabled={isPublishing || selectedMediaType !== "photo" || selectedMediaList.length === 0}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[22px] text-foreground">person_add</span>
              <span className="text-sm text-foreground">
                Marcar pessoas {allTags.length > 0 && `(${allTags.length})`}
              </span>
            </div>
            <span className="material-symbols-outlined text-[20px] text-muted-foreground">chevron_right</span>
          </button>
          <button 
            onClick={() => setViewMode("music-picker")}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors" 
            disabled={isPublishing}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[22px] text-foreground">music_note</span>
              <div className="flex flex-col items-start">
                <span className="text-sm text-foreground">
                  {selectedMusic ? selectedMusic.track.title : "Adicionar música"}
                </span>
                {selectedMusic && (
                  <span className="text-xs text-muted-foreground">
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
                  className="w-6 h-6 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[16px] text-muted-foreground">close</span>
                </button>
              )}
              <span className="material-symbols-outlined text-[20px] text-muted-foreground">chevron_right</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[90dvh] p-0">
          {defaultContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl h-[90vh] p-0 overflow-hidden">
        {defaultContent}
      </DialogContent>
    </Dialog>
  );
};
