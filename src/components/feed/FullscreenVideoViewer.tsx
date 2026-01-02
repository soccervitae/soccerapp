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
  onClose: (currentTime?: number, isMuted?: boolean) => void;
  originRect?: OriginRect | null;
  initialTime?: number;
  initialMuted?: boolean;
}

export const FullscreenVideoViewer = ({
  videoUrl,
  isOpen,
  onClose,
  originRect,
  initialTime = 0,
  initialMuted = true,
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
  }, [isOpen, initialTime, initialMuted]);

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
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      {isOpen && !isExiting && (
        <motion.div
          className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
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
            exit={initialStyles}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 25,
            }}
          >
            <motion.video
              ref={videoRef}
              src={videoUrl}
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