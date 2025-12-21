import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useViewStory, useLikeStory, type GroupedStories } from "@/hooks/useStories";
import { useAuth } from "@/contexts/AuthContext";

interface StoryViewerProps {
  groupedStories: GroupedStories[];
  initialGroupIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

type TransitionDirection = "next" | "prev" | null;

export const StoryViewer = ({ groupedStories, initialGroupIndex, isOpen, onClose }: StoryViewerProps) => {
  const { user } = useAuth();
  const viewStory = useViewStory();
  const likeStory = useLikeStory();

  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<TransitionDirection>(null);
  const [isPaused, setIsPaused] = useState(false);

  const currentGroup = groupedStories[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];

  useEffect(() => {
    if (isOpen && currentStory && user) {
      viewStory.mutate(currentStory.id);
    }
  }, [currentStory?.id, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    
    setProgress(0);
    const interval = setInterval(() => {
      if (isTransitioning || isPaused) return;
      
      setProgress(prev => {
        if (prev >= 100) {
          goToNextStory();
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, currentGroupIndex, currentStoryIndex, isTransitioning, isPaused]);

  useEffect(() => {
    setCurrentGroupIndex(initialGroupIndex);
    setCurrentStoryIndex(0);
    setProgress(0);
  }, [initialGroupIndex]);

  const handlePauseStart = () => setIsPaused(true);
  const handlePauseEnd = () => setIsPaused(false);

  const goToNextStory = () => {
    if (!currentGroup) return;

    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (currentGroupIndex < groupedStories.length - 1) {
      handleTransition("next", currentGroupIndex + 1);
    } else {
      onClose();
    }
  };

  const goToPreviousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (currentGroupIndex > 0) {
      handleTransition("prev", currentGroupIndex - 1);
    }
  };

  const handleTransition = (direction: TransitionDirection, newGroupIndex: number) => {
    if (isTransitioning) return;
    
    setTransitionDirection(direction);
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentGroupIndex(newGroupIndex);
      setCurrentStoryIndex(0);
      setProgress(0);
      
      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionDirection(null);
      }, 300);
    }, 150);
  };

  if (!currentStory || !currentGroup) return null;

  const getTransitionClasses = () => {
    if (!isTransitioning) return "opacity-100 scale-100 translate-x-0";
    
    if (transitionDirection === "next") {
      return "opacity-0 scale-95 -translate-x-4";
    } else if (transitionDirection === "prev") {
      return "opacity-0 scale-95 translate-x-4";
    }
    return "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full h-[100dvh] max-h-[100dvh] p-0 border-0 bg-black rounded-none sm:rounded-2xl sm:h-[90vh] sm:max-h-[800px]">
        <div className="relative w-full h-full flex flex-col overflow-hidden">
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-3 pt-4">
            {currentGroup.stories.map((_, index) => (
              <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{ 
                    width: index < currentStoryIndex ? '100%' : index === currentStoryIndex ? `${progress}%` : '0%' 
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div 
            className={`absolute top-8 left-0 right-0 z-20 flex items-center justify-between px-4 transition-all duration-300 ease-out ${getTransitionClasses()}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-primary to-emerald-400">
                <img
                  src={currentGroup.avatarUrl || "/placeholder.svg"}
                  alt={currentGroup.username}
                  className="w-full h-full rounded-full border-2 border-background object-cover"
                />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{currentGroup.fullName || currentGroup.username}</p>
                <p className="text-white/60 text-xs">Agora</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          {/* Story Media */}
          <div className="flex-1 flex items-center justify-center bg-black relative">
            {currentStory.media_type === "video" ? (
              <video
                src={currentStory.media_url}
                className={`w-full h-full object-contain transition-all duration-300 ease-out ${getTransitionClasses()}`}
                autoPlay
                muted
                playsInline
              />
            ) : (
              <img
                src={currentStory.media_url}
                alt={currentGroup.username}
                className={`w-full h-full object-contain transition-all duration-300 ease-out ${getTransitionClasses()}`}
              />
            )}
          </div>

          {/* Navigation areas */}
          <div 
            className="absolute inset-0 flex z-10"
            onMouseDown={handlePauseStart}
            onMouseUp={handlePauseEnd}
            onMouseLeave={handlePauseEnd}
            onTouchStart={handlePauseStart}
            onTouchEnd={handlePauseEnd}
          >
            <button 
              onClick={goToPreviousStory} 
              className="w-1/3 h-full focus:outline-none"
              aria-label="Story anterior"
            />
            <div className="w-1/3" />
            <button 
              onClick={goToNextStory} 
              className="w-1/3 h-full focus:outline-none"
              aria-label="Próximo story"
            />
          </div>

          {/* Pause indicator */}
          {isPaused && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
              <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center animate-scale-in">
                <span className="material-symbols-outlined text-white text-[32px]">pause</span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-6 bg-gradient-to-t from-black/60 to-transparent">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Enviar mensagem..."
                className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2.5 text-white text-sm placeholder:text-white/50 focus:outline-none focus:border-white/40"
              />
              <button className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors">
                <span className="material-symbols-outlined text-[24px]">favorite_border</span>
              </button>
              <button className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors">
                <span className="material-symbols-outlined text-[24px]">send</span>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
