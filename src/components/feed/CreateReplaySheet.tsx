import { useState, useEffect, useRef, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useDeviceCamera } from "@/hooks/useDeviceCamera";
import { useDeviceGallery, GalleryMedia } from "@/hooks/useDeviceGallery";
import { VideoRecorder } from "./VideoRecorder";
import { MusicPicker } from "./MusicPicker";
import { ReplayTextStickerEditor } from "./ReplayTextStickerEditor";
import { SelectedMusicWithTrim, formatDuration } from "@/hooks/useMusic";

interface CreateReplaySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReplayCreated?: (replay: { image: string; caption: string; isVideo?: boolean }) => void;
}

type MediaType = "photo" | "video";
type ViewMode = "default" | "video-recorder" | "music-picker" | "text-sticker-editor";


export const CreateReplaySheet = ({ open, onOpenChange, onReplayCreated }: CreateReplaySheetProps) => {
  const isMobile = useIsMobile();
  const isPWA = useIsPWA();
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>("photo");
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [capturedMedia, setCapturedMedia] = useState<{ url: string; type: MediaType; blob?: Blob }[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("default");
  const [activeTab, setActiveTab] = useState<"all" | "photos" | "videos">("all");
  const [selectedMusic, setSelectedMusic] = useState<SelectedMusicWithTrim | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { takePhoto, pickFromGallery, pickMultipleFromGallery, isLoading, error, isNative } = useDeviceCamera();
  const { 
    media: deviceGallery, 
    loadGallery, 
    loadMore,
    getMediaPath,
    clearGallery,
    isLoading: isGalleryLoading,
    isLoadingMore,
    error: galleryError,
    hasMore,
    isNative: isGalleryNative,
    isAndroid,
    supportsGalleryPlugin
  } = useDeviceGallery();

  // Load gallery when sheet opens (not when viewMode changes)
  useEffect(() => {
    if (open && supportsGalleryPlugin) {
      const tabType = activeTab === "all" ? "all" : activeTab === "photos" ? "image" : "video";
      loadGallery({ type: tabType, limit: 50 });
    }
  }, [open, supportsGalleryPlugin, activeTab, loadGallery]);

  // Auto-select first media when gallery loads
  useEffect(() => {
    if (deviceGallery.length > 0 && !selectedMedia && capturedMedia.length === 0) {
      const firstItem = deviceGallery[0];
      const mediaUrl = firstItem.webPath || firstItem.thumbnail;
      setSelectedMedia(firstItem.thumbnail.startsWith('data:') 
        ? firstItem.thumbnail 
        : `data:image/jpeg;base64,${firstItem.thumbnail}`);
      setSelectedMediaType(firstItem.type === "video" ? "video" : "photo");
    }
  }, [deviceGallery, selectedMedia, capturedMedia.length]);


  useEffect(() => {
    if (error || galleryError) {
      toast.error(error || galleryError);
    }
  }, [error, galleryError]);

  useEffect(() => {
    if (!open) {
      setViewMode("default");
      setSelectedMedia(null);
      setSelectedImages([]);
      setMultiSelect(false);
      setCapturedMedia([]);
      setSelectedMusic(null);
      clearGallery();
    }
  }, [open, clearGallery]);

  const handleTakePhoto = async () => {
    const photo = await takePhoto();
    if (photo?.webPath) {
      setCapturedMedia(prev => [{ url: photo.webPath, type: "photo", blob: photo.blob }, ...prev]);
      setSelectedMedia(photo.webPath);
      setSelectedMediaType("photo");
      toast.success("Foto capturada!");
    }
  };

  const handleVideoRecorded = (videoUrl: string, blob: Blob) => {
    setCapturedMedia(prev => [{ url: videoUrl, type: "video", blob }, ...prev]);
    setSelectedMedia(videoUrl);
    setSelectedMediaType("video");
    setViewMode("default");
    toast.success("Vídeo gravado!");
  };

  const handlePickFromGallery = async () => {
    if (multiSelect) {
      const photos = await pickMultipleFromGallery(10);
      if (photos.length > 0) {
        const newItems = photos.map(p => ({ url: p.webPath, type: "photo" as MediaType, blob: p.blob }));
        setCapturedMedia(prev => [...newItems, ...prev]);
        setSelectedImages(photos.map(p => p.webPath));
        toast.success(`${photos.length} imagem(ns) selecionada(s)!`);
      }
    } else {
      const photo = await pickFromGallery();
      if (photo?.webPath) {
        setCapturedMedia(prev => [{ url: photo.webPath, type: "photo", blob: photo.blob }, ...prev]);
        setSelectedMedia(photo.webPath);
        setSelectedMediaType("photo");
      }
    }
  };

  const handleMediaSelect = async (media: { url: string; originalPath: string; id: string; type: MediaType }) => {
    let mediaUrl = media.originalPath || media.url;
    
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
      setSelectedMedia(media.url);
      setSelectedMediaType(media.type);
    }
  };

  const handleAdvance = () => {
    const mediaToAdvance = multiSelect ? selectedImages[0] : selectedMedia;
    
    if (!mediaToAdvance) {
      toast.error("Selecione uma imagem ou vídeo para o replay");
      return;
    }
    
    setViewMode("text-sticker-editor");
  };

  const handleFinalPublish = (finalMediaUrl: string) => {
    if (onReplayCreated) {
      onReplayCreated({ 
        image: finalMediaUrl, 
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
    setViewMode("default");
    setCapturedMedia([]);
    setSelectedMusic(null);
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
  
  const deviceGalleryMedia = deviceGallery.map((item) => ({
    url: item.thumbnail.startsWith('data:') ? item.thumbnail : `data:image/jpeg;base64,${item.thumbnail}`,
    originalPath: item.webPath,
    id: item.id,
    type: (item.type === "video" ? "video" : "photo") as MediaType
  }));

  const allMedia = [
    ...capturedMedia.map(m => ({ ...m, originalPath: m.url, id: `captured-${m.url}` })),
    ...deviceGalleryMedia,
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
        onClose={() => setViewMode("default")}
      />
    );
  }

  // Show music picker fullscreen
  if (viewMode === "music-picker") {
    const musicContent = (
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
        maxTrimDuration={15}
      />
    );

    if (isMobile) {
      return (
        <Drawer open={open} onOpenChange={handleClose}>
          <DrawerContent className="h-full rounded-t-none p-0">
            {musicContent}
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-xl h-[90vh] p-0 overflow-hidden">
          {musicContent}
        </DialogContent>
      </Dialog>
    );
  }

  // Show text/sticker editor fullscreen
  if (viewMode === "text-sticker-editor") {
    const mediaToEdit = multiSelect ? selectedImages[0] : selectedMedia;
    
    return (
      <ReplayTextStickerEditor
        mediaUrl={mediaToEdit!}
        mediaType={selectedMediaType}
        onPublish={handleFinalPublish}
        onCancel={() => setViewMode("default")}
      />
    );
  }

  // Main content with integrated gallery
  const mainContent = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button 
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <span className="material-symbols-outlined text-[24px] text-foreground">close</span>
        </button>
        
        <span className="text-base font-semibold text-foreground">Novo Replay</span>
        
        <Button 
          onClick={handleAdvance}
          size="sm"
          variant="ghost"
          className="text-primary font-semibold text-sm hover:bg-transparent"
          disabled={!hasSelection || isLoading}
        >
          Avançar
        </Button>
      </div>

      {/* Preview Area */}
      <div className="relative bg-black flex-shrink-0" style={{ height: '40%' }}>
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
              {isGalleryLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-white/60 text-sm">Carregando galeria...</span>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[48px] text-white/40">photo_library</span>
                  <p className="text-white/60 text-sm mt-2">Selecione uma foto ou vídeo</p>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Preview controls */}
        {selectedMedia && (
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <button className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px] text-white">aspect_ratio</span>
            </button>
            <div className="flex gap-2">
              <button className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px] text-white">auto_fix_high</span>
              </button>
              <button 
                onClick={() => setViewMode("music-picker")}
                className={`w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors ${
                  selectedMusic ? 'bg-primary' : 'bg-black/50'
                }`}
              >
                <span className="material-symbols-outlined text-[22px] text-white">music_note</span>
              </button>
            </div>
          </div>
        )}

        {/* Selected music indicator */}
        {selectedMusic && (
          <div className="absolute bottom-16 left-4 right-4 flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-sm rounded-lg">
            <span className="material-symbols-outlined text-[18px] text-white animate-pulse">music_note</span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{selectedMusic.track.title}</p>
              <p className="text-white/60 text-[10px] truncate">
                {selectedMusic.track.artist} · {formatDuration(selectedMusic.startSeconds)} - {formatDuration(selectedMusic.endSeconds)}
              </p>
            </div>
            <button
              onClick={() => setSelectedMusic(null)}
              className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[14px] text-white">close</span>
            </button>
          </div>
        )}

        {selectedMedia && selectedMediaType === "video" && (
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-red-500/90 backdrop-blur-sm rounded-full flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-white">videocam</span>
            <span className="text-white text-xs font-semibold">VÍDEO</span>
          </div>
        )}

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
        {/* Toolbar with Camera/Video buttons and Tabs */}
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

        {/* Android fallback - show button to open native picker */}
        {isAndroid && (
          <div className="px-4 py-4">
            <button
              onClick={handlePickFromGallery}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl p-4 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[24px]">photo_library</span>
              <span className="font-medium">Escolher da Galeria</span>
            </button>
          </div>
        )}

        {/* Gallery Grid */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto"
          onScroll={(e) => {
            const target = e.currentTarget;
            const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 200;
            if (isNearBottom && hasMore && !isLoadingMore && supportsGalleryPlugin) {
              loadMore();
            }
          }}
        >
          {/* Loading state for gallery */}
          {isGalleryLoading && filteredMedia.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Carregando galeria...</span>
              </div>
            </div>
          )}

          {/* Gallery items grid */}
          {(!isGalleryLoading || filteredMedia.length > 0) && (
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
                  : selectedMedia === media.url;
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
                    
                    {isCaptured && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-primary rounded text-[10px] font-bold text-primary-foreground">
                        NOVO
                      </div>
                    )}
                    
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

                    {media.type === "video" && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded">
                        <span className="material-symbols-outlined text-[14px] text-white">play_arrow</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

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
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className={`${isPWA ? "h-full" : "h-[90vh]"} p-0`}>
          {mainContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl h-[85vh] p-0 overflow-hidden">
        {mainContent}
      </DialogContent>
    </Dialog>
  );
};
