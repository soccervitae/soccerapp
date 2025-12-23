import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useDeviceCamera } from "@/hooks/useDeviceCamera";
import { useDeviceGallery, GalleryMedia } from "@/hooks/useDeviceGallery";
import { VideoRecorder } from "./VideoRecorder";

interface CreateReplaySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReplayCreated?: (replay: { image: string; caption: string; isVideo?: boolean }) => void;
}

type MediaType = "photo" | "video";
type ViewMode = "gallery" | "camera" | "video-recorder";

// Fallback gallery images (used when device gallery is not available)
const fallbackGalleryImages = [
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400&h=400&fit=crop",
];

export const CreateReplaySheet = ({ open, onOpenChange, onReplayCreated }: CreateReplaySheetProps) => {
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>("photo");
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [capturedMedia, setCapturedMedia] = useState<{ url: string; type: MediaType }[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");
  const [activeTab, setActiveTab] = useState<"all" | "photos" | "videos">("all");

  const { takePhoto, pickFromGallery, pickMultipleFromGallery, isLoading, error, isNative } = useDeviceCamera();
  const { 
    media: deviceGallery, 
    loadGallery, 
    getMediaPath,
    clearGallery,
    isLoading: isGalleryLoading, 
    error: galleryError,
    isNative: isGalleryNative 
  } = useDeviceGallery();

  // Load gallery when sheet opens
  useEffect(() => {
    if (open && isGalleryNative) {
      const tabType = activeTab === "all" ? "all" : activeTab === "photos" ? "image" : "video";
      loadGallery({ type: tabType, limit: 50 });
    }
  }, [open, isGalleryNative, activeTab, loadGallery]);

  useEffect(() => {
    if (error || galleryError) {
      toast.error(error || galleryError);
    }
  }, [error, galleryError]);

  useEffect(() => {
    if (!open) {
      setViewMode("gallery");
      clearGallery();
    }
  }, [open, clearGallery]);

  const handleTakePhoto = async () => {
    const photo = await takePhoto();
    if (photo?.webPath) {
      setCapturedMedia(prev => [{ url: photo.webPath, type: "photo" }, ...prev]);
      setSelectedMedia(photo.webPath);
      setSelectedMediaType("photo");
      toast.success("Foto capturada!");
    }
  };

  const handleVideoRecorded = (videoUrl: string, _blob: Blob) => {
    setCapturedMedia(prev => [{ url: videoUrl, type: "video" }, ...prev]);
    setSelectedMedia(videoUrl);
    setSelectedMediaType("video");
    setViewMode("gallery");
    toast.success("Vídeo gravado!");
  };

  const handlePickFromGallery = async () => {
    if (multiSelect) {
      const photos = await pickMultipleFromGallery(10);
      if (photos.length > 0) {
        const newImages = photos.map(p => p.webPath);
        setCapturedMedia(prev => [...newImages.map(url => ({ url, type: "photo" as MediaType })), ...prev]);
        setSelectedImages(newImages);
        toast.success(`${photos.length} imagem(ns) selecionada(s)!`);
      }
    } else {
      const photo = await pickFromGallery();
      if (photo?.webPath) {
        setCapturedMedia(prev => [{ url: photo.webPath, type: "photo" }, ...prev]);
        setSelectedMedia(photo.webPath);
        setSelectedMediaType("photo");
      }
    }
  };

  const handleMediaSelect = async (media: { url: string; originalPath: string; id: string; type: MediaType }) => {
    // For device gallery items, try to get the full path
    let mediaUrl = media.originalPath || media.url;
    
    // If it's a device gallery item (not fallback/captured), get the actual path
    if (media.id.startsWith('data:') === false && !media.id.startsWith('fallback-') && !media.id.startsWith('captured-') && isGalleryNative) {
      const fullPath = await getMediaPath(media.id);
      if (fullPath) {
        mediaUrl = fullPath;
      }
    }

    if (multiSelect) {
      setSelectedImages(prev => 
        prev.includes(mediaUrl) 
          ? prev.filter(img => img !== mediaUrl)
          : [...prev, mediaUrl]
      );
    } else {
      setSelectedMedia(mediaUrl);
      setSelectedMediaType(media.type);
    }
  };

  const handlePublish = () => {
    const mediaToPublish = multiSelect ? selectedImages[0] : selectedMedia;
    
    if (!mediaToPublish) {
      toast.error("Selecione uma imagem ou vídeo para o replay");
      return;
    }
    
    if (onReplayCreated) {
      onReplayCreated({ 
        image: mediaToPublish, 
        caption: "",
        isVideo: selectedMediaType === "video"
      });
    }
    
    toast.success("Replay publicado com sucesso!");
    handleClose();
  };

  const handleClose = () => {
    setSelectedMedia(null);
    setSelectedImages([]);
    setMultiSelect(false);
    setViewMode("gallery");
    onOpenChange(false);
  };

  const toggleMultiSelect = () => {
    setMultiSelect(!multiSelect);
    if (multiSelect) {
      setSelectedImages([]);
    } else if (selectedMedia) {
      setSelectedImages([selectedMedia]);
      setSelectedMedia(null);
    }
  };

  const hasSelection = multiSelect ? selectedImages.length > 0 : !!selectedMedia;
  
  // Combine captured media with device gallery or fallback
  const deviceGalleryMedia = deviceGallery.map((item) => ({
    url: item.thumbnail.startsWith('data:') ? item.thumbnail : `data:image/jpeg;base64,${item.thumbnail}`,
    originalPath: item.webPath,
    id: item.id,
    type: (item.type === "video" ? "video" : "photo") as MediaType
  }));

  const fallbackMedia = !isGalleryNative || deviceGallery.length === 0 
    ? fallbackGalleryImages.map((url, index) => ({ 
        url, 
        originalPath: url,
        id: `fallback-${index}`,
        type: (index % 4 === 2 ? "video" : "photo") as MediaType 
      }))
    : [];

  const allMedia = [
    ...capturedMedia.map(m => ({ ...m, originalPath: m.url, id: `captured-${m.url}` })),
    ...deviceGalleryMedia,
    ...fallbackMedia
  ];

  const filteredMedia = allMedia.filter(media => {
    if (activeTab === "all") return true;
    if (activeTab === "photos") return media.type === "photo";
    if (activeTab === "videos") return media.type === "video";
    return true;
  });

  // Show video recorder fullscreen
  if (viewMode === "video-recorder") {
    return (
      <VideoRecorder
        onVideoRecorded={handleVideoRecorded}
        onClose={() => setViewMode("gallery")}
      />
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl p-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button 
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <span className="material-symbols-outlined text-[24px] text-foreground">close</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-foreground">Novo Replay</span>
          </div>
          
          <Button 
            onClick={handlePublish}
            size="sm"
            variant="ghost"
            className="text-primary font-semibold text-sm hover:bg-transparent"
            disabled={!hasSelection || isLoading}
          >
            Avançar
          </Button>
        </div>

        {/* Preview Area */}
        <div className="relative bg-black flex-shrink-0" style={{ height: '45%' }}>
          {selectedMedia ? (
            selectedMediaType === "video" ? (
              <video
                src={selectedMedia}
                className="w-full h-full object-contain"
                controls
                autoPlay
                loop
                muted
              />
            ) : (
              <img
                src={selectedMedia}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-[48px] text-white/40">photo_library</span>
                <p className="text-white/60 text-sm mt-2">Selecione uma foto ou vídeo</p>
              </div>
            </div>
          )}
          
          {/* Preview controls */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <button className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px] text-white">aspect_ratio</span>
            </button>
            <div className="flex gap-2">
              <button className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px] text-white">auto_fix_high</span>
              </button>
              <button className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px] text-white">music_note</span>
              </button>
            </div>
          </div>

          {/* Media type badge */}
          {selectedMedia && selectedMediaType === "video" && (
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-red-500/90 backdrop-blur-sm rounded-full flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-white">videocam</span>
              <span className="text-white text-xs font-semibold">VÍDEO</span>
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-white text-sm">Carregando...</span>
              </div>
            </div>
          )}
        </div>

        {/* Gallery Section */}
        <div className="flex-1 flex flex-col min-h-0 bg-background">
          {/* Gallery Header with Tabs */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-1 bg-muted rounded-full p-1">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  activeTab === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveTab("photos")}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  activeTab === "photos" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Fotos
              </button>
              <button
                onClick={() => setActiveTab("videos")}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  activeTab === "videos" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Vídeos
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleMultiSelect}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  multiSelect ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
                title="Selecionar múltiplas"
              >
                <span className="material-symbols-outlined text-[20px]">library_add_check</span>
              </button>
              <button 
                onClick={handleTakePhoto}
                disabled={isLoading}
                className="w-9 h-9 bg-muted text-foreground rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-50"
                title="Tirar foto"
              >
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              </button>
              <button 
                onClick={() => setViewMode("video-recorder")}
                className="w-9 h-9 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                title="Gravar vídeo"
              >
                <span className="material-symbols-outlined text-[20px]">videocam</span>
              </button>
            </div>
          </div>

          {/* Native device info banner */}
          {isNative && (
            <div className="px-4 py-2 bg-primary/10 border-b border-border">
              <p className="text-xs text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">smartphone</span>
                Acesso à câmera e galeria do dispositivo ativado
              </p>
            </div>
          )}

          {/* Gallery Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-4 gap-0.5">
              {/* Camera tile */}
              <button
                onClick={handleTakePhoto}
                disabled={isLoading}
                className="relative aspect-square overflow-hidden bg-muted flex flex-col items-center justify-center gap-1 hover:bg-muted/80 transition-colors disabled:opacity-50"
              >
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px] text-primary">photo_camera</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Foto</span>
              </button>

              {/* Video recorder tile */}
              <button
                onClick={() => setViewMode("video-recorder")}
                className="relative aspect-square overflow-hidden bg-muted flex flex-col items-center justify-center gap-1 hover:bg-muted/80 transition-colors"
              >
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px] text-red-500">videocam</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Vídeo</span>
              </button>

              {/* Gallery items */}
              {filteredMedia.map((media, index) => {
                const isSelected = multiSelect 
                  ? selectedImages.includes(media.originalPath)
                  : selectedMedia === media.originalPath;
                const selectionIndex = multiSelect ? selectedImages.indexOf(media.originalPath) + 1 : 0;
                const isCaptured = media.id.startsWith('captured-');
                
                return (
                  <button
                    key={`${media.id}-${index}`}
                    onClick={() => handleMediaSelect(media)}
                    className="relative aspect-square overflow-hidden"
                  >
                    {media.type === "video" ? (
                      <video
                        src={media.url}
                        className={`w-full h-full object-cover transition-all duration-200 ${
                          isSelected ? 'scale-90 rounded-lg' : ''
                        }`}
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={media.url}
                        alt={`Gallery ${index + 1}`}
                        className={`w-full h-full object-cover transition-all duration-200 ${
                          isSelected ? 'scale-90 rounded-lg' : ''
                        }`}
                      />
                    )}
                    
                    {/* Captured badge */}
                    {isCaptured && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-primary rounded text-[10px] font-bold text-primary-foreground">
                        NOVO
                      </div>
                    )}
                    
                    {/* Selection indicator */}
                    {multiSelect && (
                      <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected 
                          ? 'bg-primary border-primary' 
                          : 'bg-black/30 border-white/70'
                      }`}>
                        {isSelected && (
                          <span className="text-xs font-bold text-primary-foreground">{selectionIndex}</span>
                        )}
                      </div>
                    )}
                    
                    {!multiSelect && isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px] text-primary-foreground">check</span>
                      </div>
                    )}

                    {/* Video indicator */}
                    {media.type === "video" && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded">
                        <span className="material-symbols-outlined text-[14px] text-white">play_arrow</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
