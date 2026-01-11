import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pause } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import type { SharedHighlight } from "@/hooks/useSharedContentData";

interface SharedHighlightViewerProps {
  highlight: SharedHighlight;
  isOpen: boolean;
  onClose: () => void;
}

export const SharedHighlightViewer = ({ highlight, isOpen, onClose }: SharedHighlightViewerProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

  const currentMedia = highlight.images[currentImageIndex];
  const isVideo = currentMedia?.media_type === "video";

  // Sync embla with current index
  useEffect(() => {
    if (!emblaApi) return;
    
    emblaApi.on("select", () => {
      setCurrentImageIndex(emblaApi.selectedScrollSnap());
      setProgress(0);
    });
  }, [emblaApi]);

  // Timer for images (5 seconds)
  useEffect(() => {
    if (!isOpen || isPaused || isVideo) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentImageIndex < highlight.images.length - 1) {
            emblaApi?.scrollNext();
          } else {
            onClose();
          }
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, isVideo, currentImageIndex, highlight.images.length, emblaApi, onClose]);

  // Reset progress when media changes
  useEffect(() => {
    setProgress(0);
  }, [currentImageIndex]);

  const handleVideoEnded = () => {
    if (currentImageIndex < highlight.images.length - 1) {
      emblaApi?.scrollNext();
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

  const handleTapNavigation = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeft = x < rect.width / 3;
    const isRight = x > (rect.width * 2) / 3;

    if (isLeft && currentImageIndex > 0) {
      emblaApi?.scrollPrev();
    } else if (isRight) {
      if (currentImageIndex < highlight.images.length - 1) {
        emblaApi?.scrollNext();
      } else {
        onClose();
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="shared-highlight-overlay"
            className="fixed inset-0 bg-black z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.95 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            key="shared-highlight-content"
            className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 280, damping: 28, mass: 0.9 }}
          >
            <div 
              className="w-full h-full max-w-md sm:h-[90vh] sm:max-h-[800px] bg-black sm:rounded-2xl overflow-hidden pointer-events-auto"
              style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="relative w-full h-full flex flex-col overflow-hidden">
                {/* Progress bars */}
                <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-3 pt-3" style={{ marginTop: 'env(safe-area-inset-top)' }}>
                  {highlight.images.map((media, index) => {
                    const mediaIsVideo = media.media_type === "video";
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
                            transition: mediaIsVideo || index !== currentImageIndex ? "none" : "width 100ms linear",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Header */}
                <div className="absolute left-0 right-0 z-20 flex items-center justify-between px-4" style={{ top: 'calc(2rem + env(safe-area-inset-top))' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-primary to-emerald-400">
                      <img
                        src={highlight.profile.avatar_url || "/placeholder.svg"}
                        alt={highlight.profile.username}
                        className="w-full h-full rounded-full border-2 border-black object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{highlight.title}</p>
                      <p className="text-white/60 text-xs">
                        @{highlight.profile.username}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Media Carousel */}
                <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
                  <div ref={emblaRef} className="w-full h-full overflow-hidden">
                    <div className="flex h-full">
                      {highlight.images.map((media, index) => (
                        <div key={media.id} className="flex-none w-full h-full flex items-center justify-center">
                          {media.media_type === "video" ? (
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
                              alt={highlight.title}
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Navigation touch zones */}
                  <div
                    className="absolute inset-0 z-10"
                    onMouseDown={handlePauseStart}
                    onMouseUp={(e) => {
                      handlePauseEnd();
                      handleTapNavigation(e);
                    }}
                    onMouseLeave={handlePauseEnd}
                    onTouchStart={handlePauseStart}
                    onTouchEnd={handlePauseEnd}
                  />

                  {/* Pause indicator */}
                  {isPaused && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                        <Pause className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer dots */}
                {highlight.images.length > 1 && (
                  <div 
                    className="absolute left-0 right-0 z-20 flex justify-center"
                    style={{ bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 0.5rem))' }}
                  >
                    <div className="flex gap-2">
                      {highlight.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => emblaApi?.scrollTo(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentImageIndex ? "bg-white" : "bg-white/30"
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
