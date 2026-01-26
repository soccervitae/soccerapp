import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useDeviceCamera } from "@/hooks/useDeviceCamera";
import { useDeviceGallery, GalleryMedia } from "@/hooks/useDeviceGallery";
import { VideoRecorder } from "@/components/feed/VideoRecorder";
import { MusicPicker } from "@/components/feed/MusicPicker";
import { ReplayTextStickerEditor } from "@/components/feed/ReplayTextStickerEditor";
import { SelectedMusicWithTrim, formatDuration } from "@/hooks/useMusic";

type MediaType = "photo" | "video";
type ViewMode = "default" | "video-recorder" | "music-picker" | "text-sticker-editor";

const CreateReplay = () => {
  const navigate = useNavigate();
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>("photo");
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [capturedMedia, setCapturedMedia] = useState<{
    url: string;
    type: MediaType;
    blob?: Blob;
  }[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("default");
  const [activeTab, setActiveTab] = useState<"all" | "photos" | "videos">("all");
  const [selectedMusic, setSelectedMusic] = useState<SelectedMusicWithTrim | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    takePhoto,
    pickFromGallery,
    pickMultipleFromGallery,
    isLoading,
    error,
    isNative
  } = useDeviceCamera();

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

  // Load gallery on page load
  useEffect(() => {
    if (supportsGalleryPlugin) {
      const tabType = activeTab === "all" ? "all" : activeTab === "photos" ? "image" : "video";
      loadGallery({
        type: tabType,
        limit: 50
      });
    }
  }, [supportsGalleryPlugin, activeTab, loadGallery]);

  // Auto-select first media when gallery loads
  useEffect(() => {
    if (deviceGallery.length > 0 && !selectedMedia && capturedMedia.length === 0) {
      const firstItem = deviceGallery[0];
      setSelectedMedia(firstItem.thumbnail.startsWith('data:') ? firstItem.thumbnail : `data:image/jpeg;base64,${firstItem.thumbnail}`);
      setSelectedMediaType(firstItem.type === "video" ? "video" : "photo");
    }
  }, [deviceGallery, selectedMedia, capturedMedia.length]);

  useEffect(() => {
    if (error || galleryError) {
      toast.error(error || galleryError);
    }
  }, [error, galleryError]);

  const handleTakePhoto = async () => {
    const photo = await takePhoto();
    if (photo?.webPath) {
      setCapturedMedia(prev => [{
        url: photo.webPath,
        type: "photo",
        blob: photo.blob
      }, ...prev]);
      setSelectedMedia(photo.webPath);
      setSelectedMediaType("photo");
      toast.success("Foto capturada!");
    }
  };

  const handleVideoRecorded = (videoUrl: string, blob: Blob) => {
    setCapturedMedia(prev => [{
      url: videoUrl,
      type: "video",
      blob
    }, ...prev]);
    setSelectedMedia(videoUrl);
    setSelectedMediaType("video");
    setViewMode("default");
    toast.success("Vídeo gravado!");
  };

  const handlePickFromGallery = async () => {
    if (multiSelect) {
      const photos = await pickMultipleFromGallery(10);
      if (photos.length > 0) {
        const newItems = photos.map(p => ({
          url: p.webPath,
          type: "photo" as MediaType,
          blob: p.blob
        }));
        setCapturedMedia(prev => [...newItems, ...prev]);
        setSelectedImages(photos.map(p => p.webPath));
        toast.success(`${photos.length} imagem(ns) selecionada(s)!`);
      }
    } else {
      const photo = await pickFromGallery();
      if (photo?.webPath) {
        setCapturedMedia(prev => [{
          url: photo.webPath,
          type: "photo",
          blob: photo.blob
        }, ...prev]);
        setSelectedMedia(photo.webPath);
        setSelectedMediaType("photo");
      }
    }
  };

  const handleMediaSelect = async (media: {
    url: string;
    originalPath: string;
    id: string;
    type: MediaType;
  }) => {
    let mediaUrl = media.originalPath || media.url;
    if (media.id.startsWith('data:') === false && !media.id.startsWith('fallback-') && !media.id.startsWith('captured-') && isGalleryNative) {
      const fullPath = await getMediaPath(media.id);
      if (fullPath) {
        mediaUrl = fullPath;
      }
    }
    if (multiSelect) {
      setSelectedImages(prev => prev.includes(mediaUrl) ? prev.filter(img => img !== mediaUrl) : [...prev, mediaUrl]);
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

  const handleFinalPublish = (finalMediaUrl: string, caption: string) => {
    toast.success("Replay publicado com sucesso!");
    navigate("/");
  };

  const handleClose = () => {
    navigate(-1);
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

  const deviceGalleryMedia = deviceGallery.map(item => ({
    url: item.thumbnail.startsWith('data:') ? item.thumbnail : `data:image/jpeg;base64,${item.thumbnail}`,
    originalPath: item.webPath,
    id: item.id,
    type: (item.type === "video" ? "video" : "photo") as MediaType
  }));

  const allMedia = [...capturedMedia.map(m => ({
    ...m,
    originalPath: m.url,
    id: `captured-${m.url}`
  })), ...deviceGalleryMedia];

  const filteredMedia = allMedia.filter(media => {
    if (activeTab === "all") return true;
    if (activeTab === "photos") return media.type === "photo";
    if (activeTab === "videos") return media.type === "video";
    return true;
  });

  // Show video recorder fullscreen
  if (viewMode === "video-recorder") {
    return <VideoRecorder onVideoRecorded={handleVideoRecorded} onClose={() => setViewMode("default")} />;
  }

  // Show music picker fullscreen
  if (viewMode === "music-picker") {
    return (
      <div className="h-screen w-full bg-black">
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
      </div>
    );
  }

  // Show text/sticker editor fullscreen
  if (viewMode === "text-sticker-editor") {
    const mediaToEdit = multiSelect ? selectedImages[0] : selectedMedia;
    const selectedMediaBlob = capturedMedia.find(m => m.url === mediaToEdit)?.blob;
    
    return (
      <ReplayTextStickerEditor 
        mediaUrl={mediaToEdit!} 
        mediaType={selectedMediaType} 
        mediaBlob={selectedMediaBlob}
        onPublish={handleFinalPublish} 
        onCancel={() => setViewMode("default")} 
      />
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-black">
      {/* Header - Glassmorphism style */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-xl z-50">
        <button 
          onClick={handleClose} 
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-all duration-200"
        >
          <span className="material-symbols-outlined text-[24px] text-white">close</span>
        </button>
        
        <span className="text-base font-semibold text-white">Novo Replay</span>
        
        <Button 
          onClick={handleAdvance} 
          size="sm" 
          className={`rounded-full px-5 font-semibold text-sm transition-all duration-200 ${
            hasSelection && !isLoading
              ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25' 
              : 'bg-white/10 text-white/40 hover:bg-white/10'
          }`}
          disabled={!hasSelection || isLoading}
        >
          Avançar
        </Button>
      </div>

      {/* Preview Area - Dark immersive */}
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
              {isGalleryLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-white/60 text-sm">Carregando galeria...</span>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[48px] text-white/30">photo_library</span>
                  <p className="text-white/50 text-sm mt-2">Selecione uma foto ou vídeo</p>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Bottom gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        
        {/* Preview controls - Floating glassmorphism */}
        {selectedMedia && (
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
            <button className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 hover:bg-white/20 transition-all duration-200">
              <span className="material-symbols-outlined text-[22px] text-white">aspect_ratio</span>
            </button>
            <div className="flex gap-2">
              <button className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 hover:bg-white/20 transition-all duration-200">
                <span className="material-symbols-outlined text-[22px] text-white">auto_fix_high</span>
              </button>
              <button 
                onClick={() => setViewMode("music-picker")} 
                className={`w-11 h-11 backdrop-blur-md rounded-full flex items-center justify-center border transition-all duration-200 ${
                  selectedMusic 
                    ? 'bg-primary border-primary shadow-lg shadow-primary/30' 
                    : 'bg-white/10 border-white/10 hover:bg-white/20'
                }`}
              >
                <span className="material-symbols-outlined text-[22px] text-white">music_note</span>
              </button>
            </div>
          </div>
        )}

        {/* Selected music indicator - Glassmorphism card */}
        {selectedMusic && (
          <div className="absolute bottom-20 left-4 right-4 flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/10 z-10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
              <span className="material-symbols-outlined text-[18px] text-white">album</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{selectedMusic.track.title}</p>
              <p className="text-white/60 text-xs truncate">
                {selectedMusic.track.artist} · {formatDuration(selectedMusic.startSeconds)} - {formatDuration(selectedMusic.endSeconds)}
              </p>
            </div>
            <button 
              onClick={() => setSelectedMusic(null)} 
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200"
            >
              <span className="material-symbols-outlined text-[16px] text-white">close</span>
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
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-white text-sm">Carregando...</span>
            </div>
          </div>
        )}
      </div>

      {/* Gallery Section - Dark theme */}
      <div className="flex-1 flex flex-col min-h-0 bg-zinc-950">
        {/* Android fallback */}
        {isAndroid && (
          <div className="px-4 py-4">
            <button 
              onClick={handlePickFromGallery} 
              disabled={isLoading} 
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl p-4 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
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
          onScroll={e => {
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
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-white/50">Carregando galeria...</span>
              </div>
            </div>
          )}

          {/* Gallery items grid */}
          {(!isGalleryLoading || filteredMedia.length > 0) && (
            <div className="grid grid-cols-4 gap-0.5 p-0.5">
              {/* Gallery picker tile - Glassmorphism */}
              <button 
                onClick={handlePickFromGallery} 
                disabled={isLoading} 
                className="relative aspect-square overflow-hidden bg-zinc-900/80 backdrop-blur-sm flex flex-col items-center justify-center gap-1.5 hover:bg-zinc-800 transition-all duration-200 disabled:opacity-50 rounded-sm"
              >
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500/30 to-blue-600/10 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/10">
                  <span className="material-symbols-outlined text-[24px] text-blue-400">photo_library</span>
                </div>
                <span className="text-[10px] text-white/60 font-medium">Galeria</span>
              </button>

              {/* Camera tile - Glassmorphism */}
              <button 
                onClick={handleTakePhoto} 
                disabled={isLoading} 
                className="relative aspect-square overflow-hidden bg-zinc-900/80 backdrop-blur-sm flex flex-col items-center justify-center gap-1.5 hover:bg-zinc-800 transition-all duration-200 disabled:opacity-50 rounded-sm"
              >
                <div className="w-11 h-11 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center shadow-lg shadow-primary/10">
                  <span className="material-symbols-outlined text-[24px] text-primary">photo_camera</span>
                </div>
                <span className="text-[10px] text-white/60 font-medium">Foto</span>
              </button>

              {/* Video recorder tile - Glassmorphism */}
              <button 
                onClick={() => setViewMode("video-recorder")} 
                className="relative aspect-square overflow-hidden bg-zinc-900/80 backdrop-blur-sm flex flex-col items-center justify-center gap-1.5 hover:bg-zinc-800 transition-all duration-200 rounded-sm"
              >
                <div className="w-11 h-11 bg-gradient-to-br from-red-500/30 to-red-600/10 rounded-full flex items-center justify-center shadow-lg shadow-red-500/10">
                  <span className="material-symbols-outlined text-[24px] text-red-400">videocam</span>
                </div>
                <span className="text-[10px] text-white/60 font-medium">Vídeo</span>
              </button>

              {/* Multi-select tile - Glassmorphism */}
              <button 
                onClick={toggleMultiSelect} 
                className={`relative aspect-square overflow-hidden backdrop-blur-sm flex flex-col items-center justify-center gap-1.5 transition-all duration-200 rounded-sm ${
                  multiSelect 
                    ? 'bg-primary/20 ring-2 ring-primary ring-inset' 
                    : 'bg-zinc-900/80 hover:bg-zinc-800'
                }`}
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
                  multiSelect 
                    ? 'bg-primary shadow-primary/30' 
                    : 'bg-gradient-to-br from-purple-500/30 to-purple-600/10 shadow-purple-500/10'
                }`}>
                  <span className={`material-symbols-outlined text-[24px] ${multiSelect ? 'text-white' : 'text-purple-400'}`}>
                    {multiSelect ? 'check_circle' : 'library_add_check'}
                  </span>
                </div>
                <span className={`text-[10px] font-medium ${multiSelect ? 'text-primary' : 'text-white/60'}`}>
                  {multiSelect ? 'Multi ✓' : 'Multi'}
                </span>
              </button>

              {/* Gallery items */}
              {filteredMedia.map((media, index) => {
                const isSelected = multiSelect ? selectedImages.includes(media.originalPath) : selectedMedia === media.url;
                const selectionIndex = multiSelect ? selectedImages.indexOf(media.originalPath) + 1 : 0;
                const isCaptured = media.id.startsWith('captured-');
                
                return (
                  <button 
                    key={`${media.id}-${index}`} 
                    onClick={() => handleMediaSelect(media)} 
                    className="relative aspect-square overflow-hidden group"
                  >
                    {media.type === "video" ? (
                      <video 
                        src={media.url} 
                        className={`w-full h-full object-cover transition-all duration-200 ${
                          isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-black rounded-sm scale-[0.92]' : ''
                        }`} 
                        muted 
                        playsInline 
                      />
                    ) : (
                      <img 
                        src={media.url} 
                        alt={`Gallery ${index + 1}`} 
                        className={`w-full h-full object-cover transition-all duration-200 ${
                          isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-black rounded-sm scale-[0.92]' : ''
                        }`} 
                      />
                    )}
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
                    
                    {isCaptured && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-primary rounded text-[10px] font-bold text-white">
                        NOVO
                      </div>
                    )}
                    
                    {multiSelect && (
                      <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        isSelected 
                          ? 'bg-primary border-primary shadow-lg shadow-primary/30' 
                          : 'bg-black/40 border-white/60 backdrop-blur-sm'
                      }`}>
                        {isSelected && <span className="text-xs font-bold text-white">{selectionIndex}</span>}
                      </div>
                    )}
                    
                    {!multiSelect && isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                        <span className="material-symbols-outlined text-[16px] text-white">check</span>
                      </div>
                    )}

                    {media.type === "video" && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded">
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
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!hasMore && deviceGallery.length > 0 && (
            <div className="flex items-center justify-center py-4">
              <span className="text-xs text-white/40">Fim da galeria</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateReplay;
