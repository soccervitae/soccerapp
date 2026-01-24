import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CreateReplaySheet } from "@/components/feed/CreateReplaySheet";
import { toast } from "sonner";
import { useDeviceCamera } from "@/hooks/useDeviceCamera";
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
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  ImageFilters,
  applyFiltersToBlob,
  areFiltersDefault,
  getCSSFilterWithFade,
} from "@/hooks/useImageFilters";
import { CropData, getCroppedImg, hasCropData } from "@/hooks/useImageCrop";
import { PhotoTagEditor } from "@/components/feed/PhotoTagEditor";
import { PhotoTag, useCreatePostTags } from "@/hooks/usePostTags";
import { PhotoFilterEditor } from "@/components/feed/PhotoFilterEditor";
import { PhotoCropEditor } from "@/components/feed/PhotoCropEditor";
import { LocationPicker } from "@/components/feed/LocationPicker";
import { MusicPicker } from "@/components/feed/MusicPicker";
import { SelectedMusicWithTrim, formatDuration } from "@/hooks/useMusic";
import { VideoRecorder } from "@/components/feed/VideoRecorder";
import { supabase } from "@/integrations/supabase/client";
import { ModerationInfoSheet } from "@/components/feed/ModerationInfoSheet";
import { TrendingMusicCards } from "@/components/feed/TrendingMusicCards";

interface MediaItem {
  url: string;
  blob?: Blob;
  file?: File;
  isLocal: boolean;
  filters?: ImageFilters;
  cropData?: CropData;
  croppedUrl?: string;
  tags?: PhotoTag[];
}

interface SelectedLocation {
  name: string;
  lat: number;
  lng: number;
}

type MediaType = "photo" | "video";
type ViewMode = "default" | "video-recorder" | "photo-editor" | "photo-crop" | "photo-tag" | "location-picker" | "music-picker";

const MAX_PHOTOS = 10;

export const CreatePostInline = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [isReplayOpen, setIsReplayOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Post content states
  const [caption, setCaption] = useState("");
  const [selectedMediaList, setSelectedMediaList] = useState<MediaItem[]>([]);
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>("photo");
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [selectedMusic, setSelectedMusic] = useState<SelectedMusicWithTrim | null>(null);
  const [allTags, setAllTags] = useState<PhotoTag[]>([]);
  
  // UI states
  const [viewMode, setViewMode] = useState<ViewMode>("default");
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
  const [showModerationSheet, setShowModerationSheet] = useState(false);
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { takePhoto, pickMultipleFromGallery, pickVideoFromGallery, isLoading } = useDeviceCamera();
  const { uploadMedia, isUploading, progress } = useUploadMedia();
  const { compressImage, isCompressing } = useImageCompression();
  const createPost = useCreatePost();
  const createPostTags = useCreatePostTags();

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setCurrentIndex(carouselApi.selectedScrollSnap());
    carouselApi.on("select", onSelect);
    return () => { carouselApi.off("select", onSelect); };
  }, [carouselApi]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const remaining = MAX_PHOTOS - selectedMediaList.length;
    const filesToAdd = Array.from(files).slice(0, remaining);
    
    const newMediaItems: MediaItem[] = filesToAdd.map(file => ({
      url: URL.createObjectURL(file),
      file,
      blob: file,
      isLocal: true,
    }));
    
    setSelectedMediaList(prev => [...prev, ...newMediaItems]);
    setSelectedMediaType("photo");
    setIsExpanded(true);
    
    if (newMediaItems.length > 0) {
      toast.success(`${newMediaItems.length} foto${newMediaItems.length > 1 ? "s" : ""} adicionada${newMediaItems.length > 1 ? "s" : ""}!`);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePickFromGallery = async () => {
    const remaining = MAX_PHOTOS - selectedMediaList.length;
    if (remaining <= 0) { 
      toast.error(`Máximo de ${MAX_PHOTOS} fotos atingido`); 
      return; 
    }
    
    const images = await pickMultipleFromGallery(remaining);
    if (images.length > 0) {
      const mediaItems: MediaItem[] = images
        .filter((img) => img.webPath)
        .map((img) => ({
          url: img.webPath!,
          blob: img.blob,
          isLocal: true,
        }));
      setSelectedMediaList(prev => [...prev, ...mediaItems]);
      setSelectedMediaType("photo");
      setIsExpanded(true);
      toast.success(`${mediaItems.length} foto${mediaItems.length > 1 ? "s" : ""} adicionada${mediaItems.length > 1 ? "s" : ""}!`);
    }
  };

  const handleVideoRecorded = (url: string, blob: Blob) => {
    setSelectedMediaList([{ url, blob, isLocal: true }]);
    setSelectedMediaType("video");
    setViewMode("default");
    setIsExpanded(true);
    toast.success("Vídeo gravado!");
  };

  const handlePickVideoFromGallery = async () => {
    const video = await pickVideoFromGallery();
    if (video) {
      setSelectedMediaList([{ url: video.webPath, blob: video.blob, isLocal: true }]);
      setSelectedMediaType("video");
      setIsExpanded(true);
      toast.success("Vídeo selecionado!");
    }
  };

  const uploadAllMedia = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const media of selectedMediaList) {
      let uploadedUrl: string | null = null;
      
      if (media.blob && selectedMediaType === "video") {
        // Detectar extensão do vídeo original
        const videoExt = media.blob.type.split('/')[1] || 'mp4';
        uploadedUrl = await uploadMedia(media.blob, "post-media", `${Date.now()}.${videoExt}`);
      } else if (media.isLocal && (media.blob || media.url)) {
        try {
          let blob: Blob;
          
          if (hasCropData(media.cropData)) {
            blob = await getCroppedImg(media.url, media.cropData!.croppedAreaPixels);
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
          uploadedUrl = await uploadMedia(compressed, "post-media", `${Date.now()}.jpg`);
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

      // Se tem mídia, criar como não publicado para moderação
      const needsModeration = selectedMediaType === "video" || selectedMediaType === "photo";

      const result = await createPost.mutateAsync({
        content: caption || "",
        mediaUrl,
        mediaType,
        locationName: selectedLocation?.name,
        locationLat: selectedLocation?.lat,
        locationLng: selectedLocation?.lng,
        // Dados completos da música do Deezer
        musicTitle: selectedMusic?.track.title,
        musicArtist: selectedMusic?.track.artist,
        musicAudioUrl: selectedMusic?.track.audio_url,
        musicCoverUrl: selectedMusic?.track.cover_url,
        musicDurationSeconds: selectedMusic?.track.duration_seconds,
        musicSource: selectedMusic?.track.source || 'deezer',
        musicStartSeconds: selectedMusic?.startSeconds,
        musicEndSeconds: selectedMusic?.endSeconds,
        isPublished: !needsModeration,
      });

      if (allTags.length > 0 && result?.id) {
        try {
          await createPostTags.mutateAsync({ postId: result.id, tags: allTags });
        } catch (err) {
          console.error("Error saving tags:", err);
        }
      }

      // Se precisa moderação, chamar a edge function
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
            // Em caso de erro, mostrar sheet de moderação
            resetForm();
            setShowModerationSheet(true);
          } else if (data?.status === 'approved') {
            resetForm();
            toast.success("Post publicado com sucesso!");
          } else if (data?.status === 'flagged') {
            // Post pendente, mostrar sheet de moderação
            resetForm();
            setShowModerationSheet(true);
          } else {
            toast.error(data?.reason || "Seu post foi rejeitado por violar as diretrizes da comunidade.");
          }
        } catch (moderationErr) {
          console.error("Moderation call failed:", moderationErr);
          // Em caso de erro na chamada, mostrar sheet de moderação
          resetForm();
          setShowModerationSheet(true);
        }
      } else {
        // Reset all states
        resetForm();
        toast.success("Publicado com sucesso!");
      }
      
      // Dispatch event to refresh home feed
      window.dispatchEvent(new CustomEvent('home-tab-pressed'));
    } catch (err) {
      console.error("Error publishing post:", err);
      toast.error("Erro ao publicar post");
    } finally {
      setIsPublishing(false);
    }
  };

  const resetForm = () => {
    setCaption("");
    setSelectedMediaList([]);
    setSelectedMediaType("photo");
    setCurrentIndex(0);
    setAllTags([]);
    setSelectedLocation(null);
    setSelectedMusic(null);
    setIsExpanded(false);
    setViewMode("default");
    setEditingPhotoIndex(null);
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
              ? { ...item, cropData, croppedUrl } 
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
    if (selectedMediaList.length <= 1) { 
      setSelectedMediaList([]); 
      setCurrentIndex(0); 
      return; 
    }
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

  if (!user) return null;

  // Render fullscreen editors in dialogs
  const renderEditorDialog = () => {
    if (viewMode === "video-recorder") {
      return (
        <Dialog open={true} onOpenChange={() => setViewMode("default")}>
          <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden">
            <VideoRecorder 
              onVideoRecorded={handleVideoRecorded} 
              onClose={() => setViewMode("default")} 
            />
          </DialogContent>
        </Dialog>
      );
    }

    if (viewMode === "photo-editor" && editingPhotoIndex !== null) {
      const mediaToEdit = selectedMediaList[editingPhotoIndex];
      return (
        <Dialog open={true} onOpenChange={() => { setEditingPhotoIndex(null); setViewMode("default"); }}>
          <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden">
            <PhotoFilterEditor
              imageUrl={mediaToEdit.croppedUrl || mediaToEdit.url}
              initialFilters={mediaToEdit.filters}
              onApply={handleApplyFilters}
              onCancel={() => {
                setEditingPhotoIndex(null);
                setViewMode("default");
              }}
            />
          </DialogContent>
        </Dialog>
      );
    }

    if (viewMode === "photo-crop" && editingPhotoIndex !== null) {
      const mediaToEdit = selectedMediaList[editingPhotoIndex];
      return (
        <Dialog open={true} onOpenChange={() => { setEditingPhotoIndex(null); setViewMode("default"); }}>
          <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden">
            <PhotoCropEditor
              imageUrl={mediaToEdit.url}
              initialCropData={mediaToEdit.cropData}
              onApply={handleApplyCrop}
              onCancel={() => {
                setEditingPhotoIndex(null);
                setViewMode("default");
              }}
            />
          </DialogContent>
        </Dialog>
      );
    }

    if (viewMode === "photo-tag" && editingPhotoIndex !== null) {
      const mediaToEdit = selectedMediaList[editingPhotoIndex];
      return (
        <Dialog open={true} onOpenChange={() => { setEditingPhotoIndex(null); setViewMode("default"); }}>
          <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden">
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
          </DialogContent>
        </Dialog>
      );
    }

    if (viewMode === "location-picker") {
      return (
        <Dialog open={true} onOpenChange={() => setViewMode("default")}>
          <DialogContent className="max-w-2xl h-[85vh] p-0 overflow-hidden">
            <LocationPicker
              initialLocation={selectedLocation}
              onConfirm={handleLocationConfirm}
              onCancel={() => setViewMode("default")}
            />
          </DialogContent>
        </Dialog>
      );
    }

    if (viewMode === "music-picker") {
      return (
        <Dialog open={true} onOpenChange={() => setViewMode("default")}>
          <DialogContent className="max-w-2xl h-[85vh] p-0 overflow-hidden">
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
          </DialogContent>
        </Dialog>
      );
    }

    return null;
  };

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        {/* Upload Progress */}
        {isPublishing && (
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-4">
            <div 
              className="h-full bg-primary transition-all duration-300" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        )}

        {/* Header with Avatar and Input */}
        <div className="flex items-start gap-3 mb-4">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(profile?.full_name || profile?.username)}
            </AvatarFallback>
          </Avatar>
          
          {isExpanded ? (
            <Textarea
              placeholder="Escreva uma legenda..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="min-h-[80px] resize-none flex-1 text-sm"
              disabled={isPublishing}
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              className="flex-1 text-left px-4 py-3 bg-muted/50 rounded-full text-muted-foreground hover:bg-muted transition-colors"
            >
              Compartilhe suas conquistas, treinos ou insights...
            </button>
          )}
        </div>

        {/* Media Preview Area (when expanded and has media) */}
        {isExpanded && selectedMediaList.length > 0 && (
          <div className="relative mb-4">
            {selectedMediaType === "video" ? (
              <>
                <video 
                  src={selectedMediaList[0]?.url} 
                  controls 
                  className="w-full max-h-[400px] object-contain rounded-lg bg-black" 
                />
                <div className="absolute top-2 left-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-foreground">videocam</span>
                  <span className="text-xs font-medium text-foreground">VÍDEO</span>
                </div>
              </>
            ) : selectedMediaList.length === 1 ? (
              <img 
                src={selectedMediaList[0]?.croppedUrl || selectedMediaList[0]?.url} 
                alt="Preview" 
                className="w-full max-h-[400px] object-contain rounded-lg" 
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
                        className="w-full max-h-[400px] object-contain rounded-lg" 
                        style={media.filters ? getCSSFilterWithFade(media.filters) : undefined}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            )}
            
            {/* Media count indicator */}
            {selectedMediaList.length > 1 && selectedMediaType === "photo" && (
              <div className="absolute top-2 left-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-foreground">photo_library</span>
                <span className="text-xs font-medium text-foreground">{currentIndex + 1}/{selectedMediaList.length}</span>
              </div>
            )}
            
            {/* Edit buttons for photos */}
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
            
            {/* Remove button */}
            <button 
              onClick={handleRemoveCurrentMedia} 
              disabled={isPublishing} 
              className="absolute top-2 right-2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px] text-foreground">close</span>
            </button>
            
            {/* Carousel dots */}
            {selectedMediaList.length > 1 && selectedMediaType === "photo" && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {selectedMediaList.map((_, index) => (
                  <button 
                    key={index} 
                    onClick={() => carouselApi?.scrollTo(index)} 
                    className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? "bg-primary w-4" : "bg-background/60"}`} 
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sortable thumbnails */}
        {isExpanded && selectedMediaList.length > 1 && selectedMediaType === "photo" && !isPublishing && (
          <div className="mb-4">
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
          </div>
        )}

        {/* Add more photos button */}
        {isExpanded && selectedMediaType === "photo" && selectedMediaList.length > 0 && selectedMediaList.length < MAX_PHOTOS && !isPublishing && (
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isLoading} 
            className="mb-4 w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px] text-foreground">add_photo_alternate</span>
            <span className="text-sm font-medium text-foreground">Adicionar mais fotos ({selectedMediaList.length}/{MAX_PHOTOS})</span>
          </button>
        )}

        {/* Trending Music Cards - Show when media is selected but no music yet */}
        {isExpanded && selectedMediaList.length > 0 && !selectedMusic && !isPublishing && (
          <TrendingMusicCards
            selectedMusic={selectedMusic}
            onSelect={setSelectedMusic}
            onOpenFullPicker={() => setViewMode("music-picker")}
            maxTrimDuration={30}
            disabled={isPublishing}
          />
        )}

        {/* Selected Music Display */}
        {isExpanded && selectedMusic && (
          <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-xl border border-primary/30 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary-foreground">music_note</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{selectedMusic.track.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {selectedMusic.track.artist} · {formatDuration(selectedMusic.startSeconds)} - {formatDuration(selectedMusic.endSeconds)}
              </p>
            </div>
            <button 
              onClick={() => {
                setSelectedMusic(null);
                toast.success("Música removida");
              }}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[18px] text-muted-foreground">close</span>
            </button>
          </div>
        )}

        {/* Options section (when expanded) */}
        {isExpanded && (
          <div className="border-t border-border pt-3 mb-3 space-y-1">
            {/* Location */}
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

            {/* Tag people */}
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

            {/* Music */}
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
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-1">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isPublishing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px] text-emerald-500">
                photo_library
              </span>
              <span className="hidden sm:inline">Galeria</span>
            </button>
            <button
              onClick={handlePickVideoFromGallery}
              disabled={isPublishing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px] text-purple-500">
                video_library
              </span>
              <span className="hidden sm:inline">Vídeo</span>
            </button>
            <button
              onClick={() => setViewMode("video-recorder")}
              disabled={isPublishing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px] text-blue-500">
                videocam
              </span>
              <span className="hidden sm:inline">Gravar</span>
            </button>
            <button
              onClick={() => setIsReplayOpen(true)}
              disabled={isPublishing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px] text-amber-500">
                slow_motion_video
              </span>
              <span className="hidden sm:inline">Replay</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {isExpanded && (
              <Button
                size="sm"
                variant="ghost"
                onClick={resetForm}
                disabled={isPublishing}
                className="text-muted-foreground"
              >
                Cancelar
              </Button>
            )}
            <Button
              size="sm"
              onClick={handlePost}
              disabled={isButtonDisabled}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isPublishing ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Dialogs */}
      {renderEditorDialog()}

      {/* Replay Sheet */}
      <CreateReplaySheet open={isReplayOpen} onOpenChange={setIsReplayOpen} />

      {/* Moderation Info Sheet */}
      <ModerationInfoSheet open={showModerationSheet} onOpenChange={setShowModerationSheet} />
    </>
  );
};
