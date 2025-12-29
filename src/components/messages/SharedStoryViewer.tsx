import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pause } from "lucide-react";
import type { SharedStory } from "@/hooks/useSharedContentData";

interface SharedStoryViewerProps {
  story: SharedStory;
  isOpen: boolean;
  onClose: () => void;
}

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMinutes < 1) return "Agora";
  if (diffMinutes < 60) return `${diffMinutes} min`;
  if (diffHours < 24) return `${diffHours} h`;

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).replace(",", " às");
};

export const SharedStoryViewer = ({ story, isOpen, onClose }: SharedStoryViewerProps) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const isVideo = story.media_type === "video";

  // Timer for progress
  useEffect(() => {
    if (!isOpen || isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          onClose();
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, onClose]);

  // Reset progress on open
  useEffect(() => {
    if (isOpen) {
      setProgress(0);
    }
  }, [isOpen]);

  const handlePauseStart = () => setIsPaused(true);
  const handlePauseEnd = () => setIsPaused(false);

  // Check if story has expired
  const isExpired = new Date(story.expires_at) < new Date();

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="shared-story-overlay"
            className="fixed inset-0 bg-black z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.95 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            key="shared-story-content"
            className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="w-full h-full max-w-md sm:h-[90vh] sm:max-h-[800px] bg-black sm:rounded-2xl overflow-hidden pointer-events-auto">
              <div className="relative w-full h-full flex flex-col overflow-hidden">
                {/* Progress bar */}
                <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-3 pt-4">
                  <div className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-100 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Header */}
                <div className="absolute top-8 left-0 right-0 z-20 flex items-center justify-between px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-primary to-emerald-400">
                      <img
                        src={story.profile.avatar_url || "/placeholder.svg"}
                        alt={story.profile.username}
                        className="w-full h-full rounded-full border-2 border-black object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">
                        {story.profile.full_name || story.profile.username}
                      </p>
                      <p className="text-white/60 text-xs">
                        {formatTimeAgo(story.created_at)}
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

                {/* Story Media */}
                <div className="flex-1 flex items-center justify-center bg-black relative">
                  {isExpired ? (
                    <div className="text-center text-white/60">
                      <p className="text-lg font-medium">Replay expirado</p>
                      <p className="text-sm">Este conteúdo não está mais disponível</p>
                    </div>
                  ) : isVideo ? (
                    <video
                      src={story.media_url}
                      className="w-full h-full object-contain"
                      autoPlay
                      playsInline
                      muted={false}
                    />
                  ) : (
                    <img
                      src={story.media_url}
                      alt={story.profile.username}
                      className="w-full h-full object-contain"
                    />
                  )}

                  {/* Navigation touch zones */}
                  <div
                    className="absolute inset-0 z-10"
                    onMouseDown={handlePauseStart}
                    onMouseUp={handlePauseEnd}
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
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
