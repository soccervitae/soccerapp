import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface FullscreenImageViewerProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const FullscreenImageViewer = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}: FullscreenImageViewerProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  
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
      onClose();
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
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, goToPrevious, goToNext, onClose]);

  const currentImage = images[currentIndex];

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          ref={containerRef}
          className="fixed inset-0 z-[60] bg-black flex items-center justify-center touch-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackgroundClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Zoom indicator */}
          {scale > 1 && (
            <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
              <span className="text-white text-sm font-medium">{Math.round(scale * 100)}%</span>
            </div>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
              <span className="text-white text-sm font-medium">
                {currentIndex + 1} / {images.length}
              </span>
            </div>
          )}

          {/* Navigation arrows (desktop) */}
          {images.length > 1 && currentIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors hidden md:flex"
            >
              <ChevronLeft className="w-7 h-7 text-white" />
            </button>
          )}
          
          {images.length > 1 && currentIndex < images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors hidden md:flex"
            >
              <ChevronRight className="w-7 h-7 text-white" />
            </button>
          )}

          {/* Image */}
          <AnimatePresence mode="wait">
            <motion.img
              key={currentIndex}
              src={currentImage}
              alt={`Image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain select-none pointer-events-auto"
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              }}
              initial={{ 
                opacity: 0, 
                x: swipeDirection === "left" ? 100 : swipeDirection === "right" ? -100 : 0 
              }}
              animate={{ opacity: imageLoaded ? 1 : 0, x: 0 }}
              exit={{ 
                opacity: 0, 
                x: swipeDirection === "left" ? -100 : swipeDirection === "right" ? 100 : 0 
              }}
              transition={{ duration: 0.2 }}
              onLoad={() => {
                setImageLoaded(true);
                setSwipeDirection(null);
              }}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={handleDoubleClick}
              draggable={false}
            />
          </AnimatePresence>

          {/* Dot indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSwipeDirection(index > currentIndex ? "left" : "right");
                    setCurrentIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex 
                      ? "bg-white w-4" 
                      : "bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};