import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Story {
  id: number;
  name: string;
  avatar: string;
  image: string;
  hasNewStory?: boolean;
  isAddStory?: boolean;
}

interface StoryViewerProps {
  stories: Story[];
  initialStoryIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export const StoryViewer = ({ stories, initialStoryIndex, isOpen, onClose }: StoryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);

  const viewableStories = stories.filter(s => !s.isAddStory);
  const currentStory = viewableStories[currentIndex];

  useEffect(() => {
    if (!isOpen) return;
    
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (currentIndex < viewableStories.length - 1) {
            setCurrentIndex(i => i + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, currentIndex, viewableStories.length, onClose]);

  useEffect(() => {
    setCurrentIndex(initialStoryIndex);
    setProgress(0);
  }, [initialStoryIndex]);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setProgress(0);
    }
  };

  const goToNext = () => {
    if (currentIndex < viewableStories.length - 1) {
      setCurrentIndex(i => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  if (!currentStory) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full h-[100dvh] max-h-[100dvh] p-0 border-0 bg-black rounded-none sm:rounded-2xl sm:h-[90vh] sm:max-h-[800px]">
        <div className="relative w-full h-full flex flex-col">
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-3 pt-4">
            {viewableStories.map((_, index) => (
              <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{ 
                    width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%' 
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 left-0 right-0 z-20 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-primary to-emerald-400">
                <img
                  src={currentStory.avatar}
                  alt={currentStory.name}
                  className="w-full h-full rounded-full border-2 border-background object-cover"
                />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{currentStory.name}</p>
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

          {/* Story Image */}
          <div className="flex-1 flex items-center justify-center bg-black">
            <img
              src={currentStory.image}
              alt={currentStory.name}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Navigation areas */}
          <div className="absolute inset-0 flex z-10">
            <button 
              onClick={goToPrevious} 
              className="w-1/3 h-full focus:outline-none"
              aria-label="Story anterior"
            />
            <div className="w-1/3" />
            <button 
              onClick={goToNext} 
              className="w-1/3 h-full focus:outline-none"
              aria-label="Próximo story"
            />
          </div>

          {/* Footer with input */}
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
