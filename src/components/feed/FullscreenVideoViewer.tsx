import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { VideoControls } from "./VideoControls";

interface FullscreenVideoViewerProps {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export const FullscreenVideoViewer = ({
  videoUrl,
  isOpen,
  onClose,
}: FullscreenVideoViewerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      videoRef.current?.play();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Video */}
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            playsInline
            autoPlay
            onClick={() => setShowControls(true)}
          />

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
