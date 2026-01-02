import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { VideoControls } from "./VideoControls";

interface OriginRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FullscreenVideoViewerProps {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
  originRect?: OriginRect | null;
}

export const FullscreenVideoViewer = ({
  videoUrl,
  isOpen,
  onClose,
  originRect,
}: FullscreenVideoViewerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setVideoLoaded(false);
      setIsExiting(false);
      videoRef.current?.play();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 250);
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

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

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Close button */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <X className="w-6 h-6 text-white" />
          </motion.button>

          {/* Video with expansion animation */}
          <motion.div
            className="relative w-full h-full flex items-center justify-center"
            initial={initialStyles}
            animate={{ 
              opacity: 1, 
              x: 0, 
              y: 0, 
              scale: 1 
            }}
            exit={isExiting ? initialStyles : { opacity: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.3
            }}
          >
            <motion.video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain blur-md"
              playsInline
              autoPlay
              onClick={() => setShowControls(true)}
              onLoadedData={() => setVideoLoaded(true)}
              animate={{
                filter: videoLoaded ? "blur(0px)" : "blur(8px)",
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>

          {/* Video Controls */}
          <VideoControls
            videoRef={videoRef}
            isVisible={showControls}
            onVisibilityChange={setShowControls}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};