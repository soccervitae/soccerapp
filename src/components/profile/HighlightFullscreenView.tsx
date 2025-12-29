import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X, Pencil, Check, Pause } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserHighlight, HighlightImage } from "@/hooks/useProfile";
import { EmblaCarouselType } from "embla-carousel";

interface HighlightFullscreenViewProps {
  viewDialogOpen: boolean;
  onClose: () => void;
  clickOrigin: DOMRect | null;
  currentImages: HighlightImage[];
  currentImageIndex: number;
  currentHighlightIndex: number;
  displayHighlights: UserHighlight[];
  selectedHighlight: UserHighlight | null;
  isOwnProfile: boolean;
  isEditingTitle: boolean;
  editedTitle: string;
  setEditedTitle: (title: string) => void;
  handleTitleKeyDown: (e: React.KeyboardEvent) => void;
  handleTitleSave: () => void;
  updateHighlight: { isPending: boolean };
  handleTitleClick: () => void;
  setDeleteDialogOpen: (open: boolean) => void;
  imageEmblaRef: (node: HTMLDivElement | null) => void;
  imageEmblaApi: EmblaCarouselType | undefined;
  highlightEmblaApi: EmblaCarouselType | undefined;
  handlePrevHighlight: () => void;
  handleNextHighlight: () => void;
  setSelectedImageToDelete: (image: HighlightImage) => void;
  setDeleteImageDialogOpen: (open: boolean) => void;
}

export const HighlightFullscreenView = ({
  viewDialogOpen,
  onClose,
  clickOrigin,
  currentImages,
  currentImageIndex,
  currentHighlightIndex,
  displayHighlights,
  selectedHighlight,
  isOwnProfile,
  isEditingTitle,
  editedTitle,
  setEditedTitle,
  handleTitleKeyDown,
  handleTitleSave,
  updateHighlight,
  handleTitleClick,
  setDeleteDialogOpen,
  imageEmblaRef,
  imageEmblaApi,
  highlightEmblaApi,
  handlePrevHighlight,
  handleNextHighlight,
  setSelectedImageToDelete,
  setDeleteImageDialogOpen,
}: HighlightFullscreenViewProps) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentMedia = currentImages[currentImageIndex];
  const isVideo = currentMedia?.media_type === 'video';

  // Timer for images (5 seconds)
  useEffect(() => {
    if (!viewDialogOpen || isPaused || isVideo || isEditingTitle) {
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Go to next image or highlight
          if (currentImageIndex < currentImages.length - 1) {
            imageEmblaApi?.scrollNext();
          } else if (currentHighlightIndex < displayHighlights.length - 1) {
            handleNextHighlight();
          } else {
            onClose();
          }
          return 0;
        }
        return prev + 2; // ~5 seconds (100/2 = 50 intervals * 100ms = 5000ms)
      });
    }, 100);

    return () => clearInterval(interval);
  }, [viewDialogOpen, isPaused, isVideo, isEditingTitle, currentImageIndex, currentImages.length, currentHighlightIndex, displayHighlights.length, imageEmblaApi, handleNextHighlight, onClose]);

  // Reset progress when media changes
  useEffect(() => {
    setProgress(0);
  }, [currentImageIndex, currentHighlightIndex, selectedHighlight?.id]);

  // Handle video end
  const handleVideoEnded = () => {
    if (currentImageIndex < currentImages.length - 1) {
      imageEmblaApi?.scrollNext();
    } else if (currentHighlightIndex < displayHighlights.length - 1) {
      handleNextHighlight();
    } else {
      onClose();
    }
  };

  const handlePauseStart = () => {
    setIsPaused(true);
    if (videoRef.current && isVideo) {
      videoRef.current.pause();
    }
  };

  const handlePauseEnd = () => {
    setIsPaused(false);
    if (videoRef.current && isVideo) {
      videoRef.current.play();
    }
  };
  // Calculate initial position inside the component to ensure fresh clickOrigin
  const getInitialPosition = () => {
    if (!clickOrigin) {
      return { opacity: 0, scale: 0.8, borderRadius: "24px" };
    }
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const originCenterX = clickOrigin.left + clickOrigin.width / 2;
    const originCenterY = clickOrigin.top + clickOrigin.height / 2;
    
    return {
      opacity: 0,
      scale: Math.min(clickOrigin.width / window.innerWidth, 0.15),
      x: originCenterX - centerX,
      y: originCenterY - centerY,
      borderRadius: "50%",
    };
  };

  return (
    <AnimatePresence mode="wait">
      {viewDialogOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="highlight-overlay"
            className="fixed inset-0 bg-black z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.95 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            key="highlight-content"
            className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none overflow-hidden"
            initial={getInitialPosition()}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              x: 0, 
              y: 0,
              borderRadius: "0px",
            }}
            exit={getInitialPosition()}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 25,
              mass: 0.8,
              opacity: { duration: 0.25 }
            }}
          >
            <div className="w-full h-full max-w-md sm:h-[90vh] sm:max-h-[800px] bg-black sm:rounded-2xl overflow-hidden pointer-events-auto">
              <div className="relative w-full h-full flex flex-col overflow-hidden">
                {/* Progress bars for images */}
                <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-3 pt-4">
                  {currentImages.map((media, index) => {
                    const mediaIsVideo = media.media_type === 'video';
                    let barProgress = 0;
                    if (index < currentImageIndex) {
                      barProgress = 100;
                    } else if (index === currentImageIndex) {
                      barProgress = mediaIsVideo ? 100 : progress;
                    }
                    return (
                      <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white"
                          style={{ 
                            width: `${barProgress}%`,
                            transition: mediaIsVideo || index !== currentImageIndex ? 'none' : 'width 100ms linear'
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Header */}
                <div className="absolute top-8 left-0 right-0 z-20 flex items-center justify-between px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-primary to-emerald-400">
                      <div 
                        className="w-full h-full rounded-full border-2 border-black bg-cover bg-center"
                        style={{ backgroundImage: `url('${selectedHighlight?.image_url}')` }}
                      />
                    </div>
                    <div>
                      {isEditingTitle && isOwnProfile ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            onKeyDown={handleTitleKeyDown}
                            className="text-sm font-semibold max-w-[150px] h-7 bg-white/10 border-white/20 text-white"
                            autoFocus
                          />
                          <button
                            onClick={handleTitleSave}
                            disabled={updateHighlight.isPending}
                            className="w-6 h-6 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleTitleClick}
                          className={`flex items-center gap-1 group ${isOwnProfile ? 'cursor-pointer' : 'cursor-default'}`}
                          disabled={!isOwnProfile}
                        >
                          <p className="text-white text-sm font-semibold">{selectedHighlight?.title}</p>
                          {isOwnProfile && (
                            <Pencil className="w-3 h-3 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      )}
                      <p className="text-white/60 text-xs">
                        {currentHighlightIndex + 1}/{displayHighlights.length} destaques
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isOwnProfile && (
                      <button 
                        onClick={() => setDeleteDialogOpen(true)}
                        className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      onClick={onClose}
                      className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Media Carousel */}
                <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
                  <div ref={imageEmblaRef} className="w-full h-full overflow-hidden">
                    <div className="flex h-full">
                      {currentImages.map((media, index) => (
                        <div key={media.id} className="flex-none w-full h-full flex items-center justify-center">
                          {media.media_type === 'video' ? (
                            <video
                              ref={index === currentImageIndex ? videoRef : undefined}
                              src={media.image_url}
                              className="w-full h-full object-contain"
                              autoPlay={index === currentImageIndex}
                              playsInline
                              muted={index !== currentImageIndex}
                              onEnded={handleVideoEnded}
                            />
                          ) : (
                            <img
                              src={media.image_url}
                              alt={selectedHighlight?.title || 'Destaque'}
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Navigation touch zones with pause functionality */}
                  <div 
                    className="absolute inset-0 flex pointer-events-none z-10"
                    onMouseDown={handlePauseStart}
                    onMouseUp={handlePauseEnd}
                    onMouseLeave={handlePauseEnd}
                    onTouchStart={handlePauseStart}
                    onTouchEnd={handlePauseEnd}
                  >
                    <button 
                      onClick={() => {
                        if (currentImageIndex === 0 && currentHighlightIndex > 0) {
                          handlePrevHighlight();
                        }
                      }}
                      className="w-1/4 h-full focus:outline-none pointer-events-auto"
                      aria-label="Destaque anterior"
                      style={{ opacity: 0 }}
                    />
                    <div className="flex-1 pointer-events-auto" />
                    <button 
                      onClick={() => {
                        if (currentImageIndex === currentImages.length - 1) {
                          if (currentHighlightIndex < displayHighlights.length - 1) {
                            handleNextHighlight();
                          } else {
                            onClose();
                          }
                        }
                      }}
                      className="w-1/4 h-full focus:outline-none pointer-events-auto"
                      aria-label="Próximo destaque"
                      style={{ opacity: 0 }}
                    />
                  </div>

                  {/* Pause indicator */}
                  {isPaused && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                        <Pause className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer with gradient */}
                <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-6 bg-gradient-to-t from-black/60 to-transparent">
                  {isOwnProfile ? (
                    // Owner footer: action buttons
                    <div className="flex items-center justify-center gap-4">
                      {currentImages.length > 1 && (
                        <button 
                          onClick={() => {
                            setSelectedImageToDelete(currentImages[currentImageIndex]);
                            setDeleteImageDialogOpen(true);
                          }}
                          className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-2 rounded-full transition-colors"
                        >
                          <X className="w-5 h-5" />
                          <span className="text-sm font-medium">Remover mídia</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    // Visitor footer: highlight dots
                    <div className="flex justify-center">
                      {displayHighlights.length > 1 && (
                        <div className="flex gap-2">
                          {displayHighlights.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => highlightEmblaApi?.scrollTo(index)}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                index === currentHighlightIndex ? 'bg-white' : 'bg-white/30'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Highlight dots for owner too */}
                {isOwnProfile && displayHighlights.length > 1 && (
                  <div className="absolute bottom-20 left-0 right-0 z-20 flex justify-center">
                    <div className="flex gap-2">
                      {displayHighlights.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => highlightEmblaApi?.scrollTo(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentHighlightIndex ? 'bg-white' : 'bg-white/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};