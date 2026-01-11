import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
interface OriginRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FullscreenImageViewerProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  originRect?: OriginRect | null;
}

export const FullscreenImageViewer = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  originRect,
}: FullscreenImageViewerProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const initialDistance = useRef<number | null>(null);
  const initialScale = useRef(1);
  const lastPosition = useRef({ x: 0, y: 0 });
  const lastTouchPosition = useRef({ x: 0, y: 0 });
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const isSwipingHorizontally = useRef(false);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    initialDistance.current = null;
    initialScale.current = 1;
    lastPosition.current = { x: 0, y: 0 };
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setImageLoaded(false);
      setCurrentIndex(initialIndex);
      setIsExiting(false);
      resetZoom();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, initialIndex, resetZoom]);

  // Reset zoom when changing images
  useEffect(() => {
    resetZoom();
    setImageLoaded(false);
  }, [currentIndex, resetZoom]);

  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setSwipeDirection("right");
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setSwipeDirection("left");
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, images.length]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 250);
  }, [onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      initialDistance.current = getDistance(e.touches[0], e.touches[1]);
      initialScale.current = scale;
      swipeStartX.current = null;
    } else if (e.touches.length === 1) {
      if (scale > 1) {
        setIsDragging(true);
        lastTouchPosition.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        lastPosition.current = position;
      } else {
        // Start tracking for swipe navigation
        swipeStartX.current = e.touches[0].clientX;
        swipeStartY.current = e.touches[0].clientY;
        isSwipingHorizontally.current = false;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance.current) {
      e.preventDefault();
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scaleChange = currentDistance / initialDistance.current;
      const newScale = Math.min(Math.max(initialScale.current * scaleChange, 1), 4);
      setScale(newScale);
      
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      const deltaX = e.touches[0].clientX - lastTouchPosition.current.x;
      const deltaY = e.touches[0].clientY - lastTouchPosition.current.y;
      
      const maxOffset = (scale - 1) * 150;
      const newX = Math.min(Math.max(lastPosition.current.x + deltaX, -maxOffset), maxOffset);
      const newY = Math.min(Math.max(lastPosition.current.y + deltaY, -maxOffset), maxOffset);
      
      setPosition({ x: newX, y: newY });
    } else if (e.touches.length === 1 && swipeStartX.current !== null && scale === 1) {
      const deltaX = e.touches[0].clientX - swipeStartX.current;
      const deltaY = e.touches[0].clientY - (swipeStartY.current || 0);
      
      // Determine if this is a horizontal swipe
      if (!isSwipingHorizontally.current && Math.abs(deltaX) > 10) {
        isSwipingHorizontally.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      initialDistance.current = null;
    }
    
    if (e.touches.length === 0) {
      setIsDragging(false);
      lastPosition.current = position;
      
      // Handle swipe navigation
      if (swipeStartX.current !== null && scale === 1 && isSwipingHorizontally.current) {
        const endX = e.changedTouches[0]?.clientX || 0;
        const deltaX = endX - swipeStartX.current;
        const threshold = 50;
        
        if (deltaX < -threshold && currentIndex < images.length - 1) {
          goToNext();
        } else if (deltaX > threshold && currentIndex > 0) {
          goToPrevious();
        }
      }
      
      swipeStartX.current = null;
      swipeStartY.current = null;
      isSwipingHorizontally.current = false;
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
    }
  };

  const handleBackgroundClick = () => {
    if (scale === 1) {
      handleClose();
    } else {
      resetZoom();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "Escape") {
        handleClose();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, goToPrevious, goToNext, handleClose]);

  const currentImage = images[currentIndex];

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

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          ref={containerRef}
          className="fixed inset-0 z-[60] bg-black flex items-center justify-center touch-none"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          onClick={handleBackgroundClick}
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

          {/* Zoom indicator */}
          {scale > 1 && (
            <motion.div
              className="absolute z-20 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm"
              style={{ top: 'max(1rem, env(safe-area-inset-top))', left: '1rem' }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            >
              <span className="text-white text-sm font-medium">{Math.round(scale * 100)}%</span>
            </motion.div>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm"
              style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
            >
              <span className="text-white text-sm font-medium">
                {currentIndex + 1} / {images.length}
              </span>
            </motion.div>
          )}

          {/* Navigation arrows (desktop) */}
          {images.length > 1 && currentIndex > 0 && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors hidden md:flex"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronLeft className="w-7 h-7 text-white" />
            </motion.button>
          )}

          {images.length > 1 && currentIndex < images.length - 1 && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors hidden md:flex"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-7 h-7 text-white" />
            </motion.button>
          )}

          {/* Image with expansion animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              className="relative max-w-full max-h-full flex items-center justify-center"
              initial={
                currentIndex === initialIndex && !swipeDirection
                  ? initialStyles
                  : {
                      opacity: 0,
                      x: swipeDirection === "left" ? 100 : swipeDirection === "right" ? -100 : 0,
                    }
              }
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={
                isExiting && currentIndex === initialIndex
                  ? initialStyles
                  : {
                      opacity: 0,
                      x: swipeDirection === "left" ? -100 : swipeDirection === "right" ? 100 : 0,
                    }
              }
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 28,
                mass: 0.9,
              }}
            >
              <motion.img
                src={currentImage}
                alt={`Image ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain select-none pointer-events-auto blur-md"
                style={{
                  transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                  transition: isDragging ? "none" : "transform 0.2s ease-out",
                }}
                animate={{
                  filter: imageLoaded ? "blur(0px)" : "blur(8px)",
                }}
                transition={{ duration: 0.3 }}
                onLoad={() => {
                  setImageLoaded(true);
                  setSwipeDirection(null);
                }}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={handleDoubleClick}
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>

          {/* Dot indicators */}
          {images.length > 1 && (
            <motion.div
              className="absolute left-0 right-0 flex justify-center gap-2 z-20"
              style={{ bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 0.5rem))' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1], delay: 0.15 }}
            >
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSwipeDirection(index > currentIndex ? "left" : "right");
                    setCurrentIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex ? "bg-white w-4" : "bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};