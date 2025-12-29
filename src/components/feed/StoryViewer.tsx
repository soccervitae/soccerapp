import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useViewStory, useLikeStory, useDeleteStory, type GroupedStories } from "@/hooks/useStories";
import { useAuth } from "@/contexts/AuthContext";
import { useStoryLikeStatus, useSendStoryReply, useStoryViewerCount, useStoryReplyCount } from "@/hooks/useStoryInteractions";
import { useQueryClient } from "@tanstack/react-query";
import { StoryViewersSheet } from "./StoryViewersSheet";
import { StoryRepliesSheet } from "./StoryRepliesSheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StoryViewerProps {
  groupedStories: GroupedStories[];
  initialGroupIndex: number;
  isOpen: boolean;
  onClose: () => void;
  originRect?: DOMRect | null;
}

type TransitionDirection = "next" | "prev" | null;

export const StoryViewer = ({ groupedStories, initialGroupIndex, isOpen, onClose, originRect }: StoryViewerProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const viewStory = useViewStory();
  const likeStory = useLikeStory();
  const deleteStory = useDeleteStory();
  const sendReply = useSendStoryReply();

  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<TransitionDirection>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [showRepliesSheet, setShowRepliesSheet] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const currentGroup = groupedStories[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];
  const isOwner = user?.id === currentGroup?.userId;

  // Story interactions
  const { data: isLiked = false } = useStoryLikeStatus(currentStory?.id);
  const { data: viewerCount = 0 } = useStoryViewerCount(isOwner ? currentStory?.id : undefined);
  const { data: replyCount = 0 } = useStoryReplyCount(isOwner ? currentStory?.id : undefined);

  useEffect(() => {
    if (isOpen && currentStory && user) {
      viewStory.mutate(currentStory.id);
    }
  }, [currentStory?.id, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    
    setProgress(0);
    const interval = setInterval(() => {
      if (isTransitioning || isPaused || showViewersSheet || showRepliesSheet || showDeleteDialog) return;
      
      setProgress(prev => {
        if (prev >= 100) {
          goToNextStory();
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, currentGroupIndex, currentStoryIndex, isTransitioning, isPaused, showViewersSheet, showRepliesSheet, showDeleteDialog]);

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

  const handleLike = async () => {
    if (!currentStory || !user || isOwner) return;
    
    try {
      await likeStory.mutateAsync({ storyId: currentStory.id, isLiked });
      queryClient.invalidateQueries({ queryKey: ["story-like-status", currentStory.id] });
      
      if (!isLiked) {
        setShowLikeAnimation(true);
        setTimeout(() => setShowLikeAnimation(false), 1000);
      }
    } catch (error) {
      console.error("Error liking story:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!currentStory || !user || !messageText.trim() || isOwner) return;
    
    try {
      await sendReply.mutateAsync({ storyId: currentStory.id, content: messageText.trim() });
      setMessageText("");
    } catch (error) {
      console.error("Error sending reply:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteStory = async () => {
    if (!currentStory) return;
    
    try {
      await deleteStory.mutateAsync(currentStory.id);
      setShowDeleteDialog(false);
      
      // Navigate to next story or close if last one
      if (currentGroup.stories.length === 1) {
        // Last story in this group
        if (currentGroupIndex < groupedStories.length - 1) {
          handleTransition("next", currentGroupIndex + 1);
        } else if (currentGroupIndex > 0) {
          handleTransition("prev", currentGroupIndex - 1);
        } else {
          onClose();
        }
      } else if (currentStoryIndex < currentGroup.stories.length - 1) {
        // Go to next story in same group
        setProgress(0);
      } else {
        // Was last story, go to previous
        setCurrentStoryIndex(prev => prev - 1);
        setProgress(0);
      }
    } catch (error) {
      console.error("Error deleting story:", error);
    }
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

  // Animation variants for Instagram-like effect
  const getInitialPosition = () => {
    if (!originRect) {
      return { opacity: 0, scale: 0.8, borderRadius: "24px" };
    }
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const originCenterX = originRect.left + originRect.width / 2;
    const originCenterY = originRect.top + originRect.height / 2;
    
    return {
      opacity: 0,
      scale: Math.min(originRect.width / window.innerWidth, 0.15),
      x: originCenterX - centerX,
      y: originCenterY - centerY,
      borderRadius: "50%",
    };
  };

  // Drag values for swipe-to-close
  const dragY = useMotionValue(0);
  const dragOpacity = useTransform(dragY, [0, 200], [1, 0.5]);
  const dragScale = useTransform(dragY, [0, 200], [1, 0.85]);
  const dragBorderRadius = useTransform(dragY, [0, 100], [0, 24]);
  const overlayOpacity = useTransform(dragY, [0, 200], [0.95, 0.3]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    } else {
      // Spring back to original position
      dragY.set(0);
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="story-overlay"
              className="fixed inset-0 bg-black z-50"
              style={{ opacity: overlayOpacity }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.95 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={onClose}
            />

            {/* Story Content */}
            <motion.div
              key="story-content"
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
              style={{ 
                y: dragY, 
                opacity: dragOpacity, 
                scale: dragScale,
                borderRadius: dragBorderRadius,
              }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.7 }}
              dragDirectionLock
              onDragEnd={handleDragEnd}
              initial={getInitialPosition()}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                x: 0, 
                y: 0,
                borderRadius: "0px",
              }}
              exit={getInitialPosition()}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 25,
                mass: 0.8,
                opacity: { duration: 0.25 }
              }}
            >
              <div className="w-full h-full max-w-md sm:h-[90vh] sm:max-h-[800px] bg-black sm:rounded-2xl overflow-hidden pointer-events-auto">
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
                    <div className="flex items-center gap-1">
                      {isOwner && (
                        <button 
                          onClick={() => setShowDeleteDialog(true)}
                          className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                          <span className="material-symbols-outlined text-[24px]">delete</span>
                        </button>
                      )}
                      <button 
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
                      >
                        <span className="material-symbols-outlined text-[24px]">close</span>
                      </button>
                    </div>
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

                    {/* Applause animation */}
                    {showLikeAnimation && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                        <span className="material-symbols-outlined fill-1 text-amber-500 text-[80px] animate-ping">
                          handshake
                        </span>
                      </div>
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

                  {/* Footer - Different for owner vs visitor */}
                  <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-6 bg-gradient-to-t from-black/60 to-transparent">
                    {isOwner ? (
                      // Owner footer: view stats
                      <div className="flex items-center justify-center gap-6">
                        <button 
                          onClick={() => setShowViewersSheet(true)}
                          className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-2 rounded-full transition-colors"
                        >
                          <span className="material-symbols-outlined text-[24px]">visibility</span>
                          <span className="text-sm font-medium">{viewerCount} {viewerCount === 1 ? 'visualização' : 'visualizações'}</span>
                        </button>
                        <button 
                          onClick={() => setShowRepliesSheet(true)}
                          className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-2 rounded-full transition-colors"
                        >
                          <span className="material-symbols-outlined text-[24px]">chat_bubble</span>
                          <span className="text-sm font-medium">{replyCount} {replyCount === 1 ? 'resposta' : 'respostas'}</span>
                        </button>
                      </div>
                    ) : (
                      // Visitor footer: like and message
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          placeholder="Enviar mensagem..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onFocus={handlePauseStart}
                          onBlur={handlePauseEnd}
                          className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2.5 text-white text-sm placeholder:text-white/50 focus:outline-none focus:border-white/40"
                        />
                        <button 
                          onClick={handleLike}
                          className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                          <span 
                            className={`material-symbols-outlined text-[24px] transition-colors ${isLiked ? 'text-amber-500' : ''}`}
                            style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            handshake
                          </span>
                        </button>
                        <button 
                          onClick={handleSendMessage}
                          disabled={!messageText.trim() || sendReply.isPending}
                          className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[24px]">send</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sheets for owner */}
      {currentStory && (
        <>
          <StoryViewersSheet 
            storyId={currentStory.id}
            isOpen={showViewersSheet}
            onClose={() => setShowViewersSheet(false)}
          />
          <StoryRepliesSheet 
            storyId={currentStory.id}
            isOpen={showRepliesSheet}
            onClose={() => setShowRepliesSheet(false)}
          />
        </>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir replay?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O replay será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteStory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
