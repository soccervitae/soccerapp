import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { VideoControls } from "./VideoControls";
import { useThemeColor } from "@/hooks/useThemeColor";

interface OriginRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FullscreenVideoViewerProps {
  videos?: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: (currentTime?: number, isMuted?: boolean) => void;
  originRect?: OriginRect | null;
  initialTime?: number;
  initialMuted?: boolean;
  /** @deprecated Use videos array instead */
  videoUrl?: string;
}

export const FullscreenVideoViewer = ({
  videos = [],
  initialIndex = 0,
  isOpen,
  onClose,
  originRect,
  initialTime = 0,
  initialMuted = true,
  videoUrl,
}: FullscreenVideoViewerProps) => {
  // Dynamic theme color for iOS status bar
  useThemeColor(isOpen, "#000000");
  // Support legacy single video prop
  const videoList = videos.length > 0 ? videos : (videoUrl ? [videoUrl] : []);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showControls, setShowControls] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  
  // Touch state for swipe
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const isSwipingHorizontally = useRef(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setVideoLoaded(false);
      setIsExiting(false);
      setCurrentIndex(initialIndex);
      if (videoRef.current) {
        videoRef.current.currentTime = initialTime;
        videoRef.current.muted = initialMuted;
        videoRef.current.play();
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, initialTime, initialMuted, initialIndex]);

  // Reset video when changing index
  useEffect(() => {
    setVideoLoaded(false);
    if (videoRef.current && isOpen) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  }, [currentIndex, isOpen]);

  const currentTimeRef = useRef<number>(initialTime);
  const isMutedRef = useRef<boolean>(initialMuted);

  const handleClose = useCallback(() => {
    if (videoRef.current) {
      currentTimeRef.current = videoRef.current.currentTime;
      isMutedRef.current = videoRef.current.muted;
      videoRef.current.pause();
    }
    setIsExiting(true);
  }, []);

  const handleExitComplete = useCallback(() => {
    if (isExiting) {
      onClose(currentTimeRef.current, isMutedRef.current);
      setIsExiting(false);
    }
  }, [isExiting, onClose]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setSwipeDirection("right");
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < videoList.length - 1) {
      setSwipeDirection("left");
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, videoList.length]);

  // Touch handlers for swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      swipeStartX.current = e.touches[0].clientX;
      swipeStartY.current = e.touches[0].clientY;
      isSwipingHorizontally.current = false;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1 || swipeStartX.current === null || swipeStartY.current === null) return;
    
    const deltaX = e.touches[0].clientX - swipeStartX.current;
    const deltaY = e.touches[0].clientY - swipeStartY.current;
    
    // Determine swipe direction on first significant movement
    if (!isSwipingHorizontally.current && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      isSwipingHorizontally.current = Math.abs(deltaX) > Math.abs(deltaY);
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (swipeStartX.current === null) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - swipeStartX.current;
    const deltaY = touch.clientY - (swipeStartY.current || 0);
    
    // Only handle horizontal swipes
    if (isSwipingHorizontally.current && Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        goToPrevious();
      } else {
        goToNext();
      }
    }
    
    swipeStartX.current = null;
    swipeStartY.current = null;
    isSwipingHorizontally.current = false;
  }, [goToPrevious, goToNext]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose, goToPrevious, goToNext]);

  // Calculate animation values based on originRect
  const getInitialStyles = () => {
    if (!originRect) {
      return {
        opacity: 0,
        scale: 0.9,
      };
    }
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calculate the center offset
    const originCenterX = originRect.x + originRect.width / 2;
    const originCenterY = originRect.y + originRect.height / 2;
    const screenCenterX = windowWidth / 2;
    const screenCenterY = windowHeight / 2;
    
    return {
      x: originCenterX - screenCenterX,
      y: originCenterY - screenCenterY,
      scale: Math.min(originRect.width / windowWidth, originRect.height / windowHeight),
      opacity: 0.8,
    };
  };

  const initialStyles = getInitialStyles();
  const currentVideoUrl = videoList[currentIndex] || "";

  if (typeof document === "undefined" || videoList.length === 0) return null;

  return createPortal(
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      {isOpen && !isExiting && (
        <motion.div
          className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close button */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="absolute z-20 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm"
            style={{ top: 'max(1rem, env(safe-area-inset-top))', right: '1rem' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
          >
            <X className="w-6 h-6 text-white" />
          </motion.button>

          {/* Video counter */}
          {videoList.length > 1 && (
            <motion.div
              className="absolute z-20 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm"
              style={{ top: 'max(1rem, env(safe-area-inset-top))', left: '1rem' }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            >
              <span className="text-white text-sm font-medium">
                {currentIndex + 1} / {videoList.length}
              </span>
            </motion.div>
          )}

          {/* Navigation arrows (desktop) */}
          {videoList.length > 1 && currentIndex > 0 && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm hidden md:flex"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </motion.button>
          )}
          {videoList.length > 1 && currentIndex < videoList.length - 1 && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm hidden md:flex"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </motion.button>
          )}

          {/* Video with expansion animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              className="relative w-full h-full flex items-center justify-center"
              initial={currentIndex === initialIndex ? initialStyles : { opacity: 0, x: swipeDirection === "left" ? 100 : -100 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: swipeDirection === "left" ? -100 : 100 }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 28,
                mass: 0.9,
              }}
            >
              <motion.video
                ref={videoRef}
                src={currentVideoUrl}
                className="w-full h-full object-contain"
                playsInline
                autoPlay
                onClick={() => setShowControls(true)}
                onLoadedData={() => setVideoLoaded(true)}
                initial={{ filter: "blur(8px)" }}
                animate={{
                  filter: videoLoaded ? "blur(0px)" : "blur(8px)",
                }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Dot indicators */}
          {videoList.length > 1 && (
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 z-20 flex gap-1.5"
              style={{ bottom: 'max(6rem, calc(env(safe-area-inset-bottom) + 5rem))' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            >
              {videoList.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSwipeDirection(index > currentIndex ? "left" : "right");
                    setCurrentIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? "bg-white scale-110"
                      : "bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </motion.div>
          )}

          {/* Video Controls */}
          <VideoControls
            videoRef={videoRef}
            isVisible={showControls}
            onVisibilityChange={setShowControls}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
