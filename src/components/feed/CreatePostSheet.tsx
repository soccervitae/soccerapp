import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useDeviceCamera } from "@/hooks/useDeviceCamera";
import { useDeviceGallery } from "@/hooks/useDeviceGallery";
import { VideoRecorder } from "@/components/feed/VideoRecorder";
import { PhotoFilterEditor } from "@/components/feed/PhotoFilterEditor";
import { PhotoCropEditor } from "@/components/feed/PhotoCropEditor";
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
import { CropData, getCroppedImg, hasCropData } from "@/hooks/useImageCrop";
import { PhotoTagEditor } from "@/components/feed/PhotoTagEditor";
import { PhotoTag, useCreatePostTags } from "@/hooks/usePostTags";
import { supabase } from "@/integrations/supabase/client";

interface CreatePostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type MediaType = "photo" | "video";
type ViewMode = "default" | "video-recorder" | "photo-editor" | "photo-crop" | "photo-tag" | "gallery-picker";

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

const MAX_PHOTOS = 10;

export const CreatePostSheet = ({ open, onOpenChange }: CreatePostSheetProps) => {
  const [caption, setCaption] = useState("");
  const [selectedMediaList, setSelectedMediaList] = useState<MediaItem[]>([]);
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>("photo");
  const [viewMode, setViewMode] = useState<ViewMode>("default");
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);

  const { takePhoto, pickMultipleFromGallery, isLoading, error } = useDeviceCamera();
  const { 
    media: deviceGallery, 
    loadGallery, 
    loadMore,
    getMediaPath,
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
    // If native, show gallery picker view
    if (isGalleryNative) {
      await loadGallery({ type: 'image', limit: 50 });
      setViewMode("gallery-picker");
      return;
    }
    
    // Fallback to native picker
    const images = await pickMultipleFromGallery(MAX_PHOTOS);
    if (images.length > 0) {
      const mediaItems: MediaItem[] = images
        .filter((img) => img.webPath)
        .map((img) => ({
          url: img.webPath!,
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

    // Get full path
    let mediaUrl = galleryItem.webPath;
    const fullPath = await getMediaPath(galleryItem.id);
    if (fullPath) {
      mediaUrl = fullPath;
    }

    setSelectedMediaList((prev) => [...prev, { url: mediaUrl, isLocal: true }]);
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
        return [...prev, { url: photo.webPath, isLocal: true }];
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

  const uploadAllMedia = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const media of selectedMediaList) {
      let uploadedUrl: string | null = null;
      
      if (media.blob && selectedMediaType === "video") {
        // Video blob - upload directly without compression
        uploadedUrl = await uploadMedia(media.blob, "post-media", `${Date.now()}.webm`);
      } else if (media.isLocal && media.url) {
        // Local image URL - apply crop, filters, compress, then upload
        try {
          let blob: Blob;
          
          // Apply crop if any
          if (hasCropData(media.cropData)) {
            blob = await getCroppedImg(media.url, media.cropData!.croppedAreaPixels);
          } else {
            const response = await fetch(media.url);
            blob = await response.blob();
          }
          
          // Apply filters if any
          if (media.filters && !areFiltersDefault(media.filters)) {
            blob = await applyFiltersToBlob(blob, media.filters);
          }
          
          const compressed = await compressImage(blob);
          uploadedUrl = await uploadMedia(compressed, "post-media", `${Date.now()}.jpg`);
        } catch (err) {
          console.error("Error processing/uploading image:", err);
        }
      } else if (media.url) {
        // Already uploaded URL
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
      
      // For now, store the first URL (for single media) or all URLs as JSON (for carousel)
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
      });

      // Save tags if any
      if (allTags.length > 0 && result?.id) {
        try {
          await createPostTags.mutateAsync({ postId: result.id, tags: allTags });
        } catch (err) {
          console.error("Error saving tags:", err);
        }
      }

      // Reset state
      setCaption("");
      setSelectedMediaList([]);
      setSelectedMediaType("photo");
      setCurrentIndex(0);
      setAllTags([]);
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
    clearGallery();
    onOpenChange(false);
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
        // Generate cropped preview URL
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

  if (viewMode === "video-recorder") {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-full rounded-t-none p-0">
          <VideoRecorder onVideoRecorded={(videoUrl, blob) => handleVideoRecorded(videoUrl, blob)} onClose={() => setViewMode("default")} />
        </SheetContent>
      </Sheet>
    );
  }

  if (viewMode === "photo-editor" && editingPhotoIndex !== null) {
    const mediaToEdit = selectedMediaList[editingPhotoIndex];
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-full rounded-t-none p-0">
          <PhotoFilterEditor
            imageUrl={mediaToEdit.croppedUrl || mediaToEdit.url}
            initialFilters={mediaToEdit.filters}
            onApply={handleApplyFilters}
            onCancel={() => {
              setEditingPhotoIndex(null);
              setViewMode("default");
            }}
          />
        </SheetContent>
      </Sheet>
    );
  }

  if (viewMode === "gallery-picker") {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl p-0 flex flex-col">
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
                        
                        {/* Selection indicator */}
                        <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected 
                            ? 'bg-primary border-primary' 
                            : 'bg-black/30 border-white/70'
                        }`}>
                          {isSelected && (
                            <span className="text-xs font-bold text-primary-foreground">{selectionIndex}</span>
                          )}
                        </div>

                        {/* Video indicator */}
                        {item.type === 'video' && (
                          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded">
                            <span className="material-symbols-outlined text-[14px] text-white">play_arrow</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Loading more indicator */}
                {isLoadingMore && (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* End of gallery indicator */}
                {!hasMore && deviceGallery.length > 0 && (
                  <div className="flex items-center justify-center py-4">
                    <span className="text-xs text-muted-foreground">Fim da galeria</span>
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (viewMode === "photo-crop" && editingPhotoIndex !== null) {
    const mediaToEdit = selectedMediaList[editingPhotoIndex];
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-full rounded-t-none p-0">
          <PhotoCropEditor
            imageUrl={mediaToEdit.url}
            initialCropData={mediaToEdit.cropData}
            onApply={handleApplyCrop}
            onCancel={() => {
              setEditingPhotoIndex(null);
              setViewMode("default");
            }}
          />
        </SheetContent>
      </Sheet>
    );
  }

  if (viewMode === "photo-tag" && editingPhotoIndex !== null) {
    const mediaToEdit = selectedMediaList[editingPhotoIndex];
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-full rounded-t-none p-0">
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
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-full rounded-t-none">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleClose} 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              disabled={isPublishing}
            >
              Cancelar
            </button>
            <SheetTitle className="text-base font-bold">Nova Publicação</SheetTitle>
            <Button 
              onClick={handlePost} 
              size="sm" 
              className="rounded font-semibold text-xs h-8 px-4" 
              disabled={isButtonDisabled}
            >
              {isPublishing ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-4 h-[calc(100%-80px)] overflow-y-auto">
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
              {/* Crop and Edit buttons for current photo */}
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
              {/* Sortable Thumbnails for Reordering */}
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-emerald-600 p-[2px] flex-shrink-0">
              <div className="w-full h-full rounded-full bg-muted flex items-center justify-center"><span className="material-symbols-outlined text-[18px] text-muted-foreground">person</span></div>
            </div>
            <Textarea 
              placeholder="Escreva uma legenda..." 
              value={caption} 
              onChange={(e) => setCaption(e.target.value)} 
              className="min-h-[100px] resize-none border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0" 
              disabled={isPublishing}
            />
          </div>

          <div className="border-t border-border pt-4 space-y-1">
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors" disabled={isPublishing}>
              <div className="flex items-center gap-3"><span className="material-symbols-outlined text-[22px] text-foreground">location_on</span><span className="text-sm text-foreground">Adicionar localização</span></div>
              <span className="material-symbols-outlined text-[20px] text-muted-foreground">chevron_right</span>
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
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors" disabled={isPublishing}>
              <div className="flex items-center gap-3"><span className="material-symbols-outlined text-[22px] text-foreground">music_note</span><span className="text-sm text-foreground">Adicionar música</span></div>
              <span className="material-symbols-outlined text-[20px] text-muted-foreground">chevron_right</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};