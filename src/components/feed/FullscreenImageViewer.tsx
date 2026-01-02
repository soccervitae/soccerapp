import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface FullscreenImageViewerProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export const FullscreenImageViewer = ({
  imageUrl,
  isOpen,
  onClose,
}: FullscreenImageViewerProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const initialDistance = useRef<number | null>(null);
  const initialScale = useRef(1);
  const lastPosition = useRef({ x: 0, y: 0 });
  const lastTouchPosition = useRef({ x: 0, y: 0 });

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
      resetZoom();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, resetZoom]);

  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      initialDistance.current = getDistance(e.touches[0], e.touches[1]);
      initialScale.current = scale;
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      lastTouchPosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      lastPosition.current = position;
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
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      initialDistance.current = null;
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
      lastPosition.current = position;
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

  return (
    <AnimatePresence>
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

          {/* Image */}
          <motion.img
            src={imageUrl}
            alt="Fullscreen"
            className="max-w-full max-h-full object-contain select-none pointer-events-auto"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ opacity: imageLoaded ? 1 : 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onLoad={() => setImageLoaded(true)}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={handleDoubleClick}
            draggable={false}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
