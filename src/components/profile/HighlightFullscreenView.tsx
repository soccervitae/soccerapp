import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X, Pencil, Check, Pause, MessageCircle, Eye, Heart, Send, ImageOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserHighlight, HighlightImage } from "@/hooks/useProfile";
import { EmblaCarouselType } from "embla-carousel";

// Helper function to check unsupported formats
const UNSUPPORTED_FORMATS = ['.dng', '.raw', '.cr2', '.nef', '.arw', '.orf', '.rw2'];
const isUnsupportedFormat = (url: string): boolean => {
  const lowerUrl = url.toLowerCase();
  return UNSUPPORTED_FORMATS.some(ext => lowerUrl.endsWith(ext));
};

import { toast } from "sonner";
import { ShareToChatSheet } from "@/components/common/ShareToChatSheet";
import { 
  useMarkHighlightViewed, 
  useHighlightViewerCount,
  useHighlightLikeStatus,
  useToggleHighlightLike,
  useSendHighlightReply,
  useHighlightReplyCount,
  useHighlightLikeCount
} from "@/hooks/useHighlightInteractions";
import { HighlightViewersSheet } from "@/components/profile/HighlightViewersSheet";
import { HighlightRepliesSheet } from "@/components/profile/HighlightRepliesSheet";
import { HighlightLikesSheet } from "@/components/profile/HighlightLikesSheet";
import { useAuth } from "@/contexts/AuthContext";

interface HighlightFullscreenViewProps {
  viewDialogOpen: boolean;
  onClose: () => void;
  clickOrigin: DOMRect | null;
  currentImages: HighlightImage[];
  currentImageIndex: number;
  currentHighlightIndex: number;
  displayHighlights: UserHighlight[];
  selectedHighlight: UserHighlight | null;
  isOwnProfile: boolean;
  isEditingTitle: boolean;
  editedTitle: string;
  setEditedTitle: (title: string) => void;
  handleTitleKeyDown: (e: React.KeyboardEvent) => void;
  handleTitleSave: () => void;
  updateHighlight: { isPending: boolean };
  handleTitleClick: () => void;
  setDeleteDialogOpen: (open: boolean) => void;
  imageEmblaRef: (node: HTMLDivElement | null) => void;
  imageEmblaApi: EmblaCarouselType | undefined;
  highlightEmblaApi: EmblaCarouselType | undefined;
  handlePrevHighlight: () => void;
  handleNextHighlight: () => void;
  setSelectedImageToDelete: (image: HighlightImage) => void;
  setDeleteImageDialogOpen: (open: boolean) => void;
  profileUsername?: string;
  authorAvatarUrl?: string;
}

export const HighlightFullscreenView = ({
  viewDialogOpen,
  onClose,
  clickOrigin,
  currentImages,
  currentImageIndex,
  currentHighlightIndex,
  displayHighlights,
  selectedHighlight,
  isOwnProfile,
  isEditingTitle,
  editedTitle,
  setEditedTitle,
  handleTitleKeyDown,
  handleTitleSave,
  updateHighlight,
  handleTitleClick,
  setDeleteDialogOpen,
  imageEmblaRef,
  imageEmblaApi,
  highlightEmblaApi,
  handlePrevHighlight,
  handleNextHighlight,
  setSelectedImageToDelete,
  setDeleteImageDialogOpen,
  profileUsername,
  authorAvatarUrl,
}: HighlightFullscreenViewProps) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [shareToChatSheetOpen, setShareToChatSheetOpen] = useState(false);
  const [viewersSheetOpen, setViewersSheetOpen] = useState(false);
  const [repliesSheetOpen, setRepliesSheetOpen] = useState(false);
  const [likesSheetOpen, setLikesSheetOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const replyInputRef = useRef<HTMLInputElement | null>(null);
  const [mediaErrors, setMediaErrors] = useState<Record<string, boolean>>({});
  
  const { user } = useAuth();
  const markViewed = useMarkHighlightViewed();
  const { data: viewerCount = 0 } = useHighlightViewerCount(
    isOwnProfile ? selectedHighlight?.id : undefined
  );
  
  // Likes and replies hooks (for visitors)
  const { data: isLiked = false } = useHighlightLikeStatus(
    !isOwnProfile ? selectedHighlight?.id : undefined
  );
  const toggleLike = useToggleHighlightLike();
  const sendReply = useSendHighlightReply();
  const { data: replyCount = 0 } = useHighlightReplyCount(
    isOwnProfile ? selectedHighlight?.id : undefined
  );
  const { data: likeCount = 0 } = useHighlightLikeCount(
    isOwnProfile ? selectedHighlight?.id : undefined
  );
  
  // Mark highlight as viewed when opened (only if not own profile)
  useEffect(() => {
    if (viewDialogOpen && selectedHighlight && user && !isOwnProfile) {
      markViewed.mutate(selectedHighlight.id);
    }
  }, [viewDialogOpen, selectedHighlight?.id, user, isOwnProfile]);

  const currentMedia = currentImages[currentImageIndex];
  const isVideo = currentMedia?.media_type === 'video';

  const shareUrl = profileUsername && selectedHighlight 
    ? `${window.location.origin}/${profileUsername}?highlight=${selectedHighlight.id}`
    : window.location.href;

  const handleShare = () => {
    setShareToChatSheetOpen(true);
  };

  // Handle like action
  const handleLike = () => {
    if (!selectedHighlight || !user) return;
    
    toggleLike.mutate({ highlightId: selectedHighlight.id, isLiked });
    
    if (!isLiked) {
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
    }
  };

  // Handle reply submit
  const handleReplySubmit = () => {
    if (!replyText.trim() || !selectedHighlight) return;
    
    sendReply.mutate({ highlightId: selectedHighlight.id, content: replyText.trim() });
    setReplyText("");
    replyInputRef.current?.blur();
  };

  // Handle double tap to like
  const lastTapRef = useRef<number>(0);
  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap - like
      if (!isOwnProfile && !isLiked) {
        handleLike();
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  // Timer for images (5 seconds)
  useEffect(() => {
    if (!viewDialogOpen || isPaused || isVideo || isEditingTitle) {
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Go to next image or highlight
          if (currentImageIndex < currentImages.length - 1) {
            imageEmblaApi?.scrollNext();
          } else if (currentHighlightIndex < displayHighlights.length - 1) {
            handleNextHighlight();
          } else {
            onClose();
          }
          return 0;
        }
        return prev + 2; // ~5 seconds (100/2 = 50 intervals * 100ms = 5000ms)
      });
    }, 100);

    return () => clearInterval(interval);
  }, [viewDialogOpen, isPaused, isVideo, isEditingTitle, currentImageIndex, currentImages.length, currentHighlightIndex, displayHighlights.length, imageEmblaApi, handleNextHighlight, onClose]);

  // Reset progress when media changes
  useEffect(() => {
    setProgress(0);
  }, [currentImageIndex, currentHighlightIndex, selectedHighlight?.id]);

  // Handle video end
  const handleVideoEnded = () => {
    if (currentImageIndex < currentImages.length - 1) {
      imageEmblaApi?.scrollNext();
    } else if (currentHighlightIndex < displayHighlights.length - 1) {
      handleNextHighlight();
    } else {
      onClose();
    }
  };

  const handlePauseStart = () => {
    setIsPaused(true);
    if (videoRef.current && isVideo) {
      videoRef.current.pause();
    }
  };

  const handlePauseEnd = () => {
    setIsPaused(false);
    if (videoRef.current && isVideo) {
      videoRef.current.play();
    }
  };
  // Instagram-style tap navigation
  const handleTapNavigation = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e 
      ? e.changedTouches[0].clientX 
      : e.clientX;
    const x = clientX - rect.left;
    const isLeft = x < rect.width / 3;
    const isRight = x > (rect.width / 3);

    if (isLeft) {
      // Navigate to previous media/highlight
      if (currentImageIndex > 0) {
        imageEmblaApi?.scrollPrev();
      } else if (currentHighlightIndex > 0) {
        handlePrevHighlight();
      }
    } else if (isRight) {
      // Navigate to next media/highlight
      if (currentImageIndex < currentImages.length - 1) {
        imageEmblaApi?.scrollNext();
      } else if (currentHighlightIndex < displayHighlights.length - 1) {
        handleNextHighlight();
      }
      // On last media of last highlight, do nothing - let timer finish
    }
  };

  // Calculate initial position inside the component to ensure fresh clickOrigin
  const getInitialPosition = () => {
    if (!clickOrigin) {
      return { opacity: 0, scale: 0.8, borderRadius: "24px" };
    }
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const originCenterX = clickOrigin.left + clickOrigin.width / 2;
    const originCenterY = clickOrigin.top + clickOrigin.height / 2;
    
    return {
      opacity: 0,
      scale: Math.min(clickOrigin.width / window.innerWidth, 0.15),
      x: originCenterX - centerX,
      y: originCenterY - centerY,
      borderRadius: "50%",
    };
  };

  return (
    <AnimatePresence mode="wait">
      {viewDialogOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="highlight-overlay"
            className="fixed inset-0 bg-black z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.95 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            key="highlight-content"
            className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none overflow-hidden"
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
                {/* Progress bars for images */}
                <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-3 pt-4">
                  {currentImages.map((media, index) => {
                    const mediaIsVideo = media.media_type === 'video';
                    let barProgress = 0;
                    if (index < currentImageIndex) {
                      barProgress = 100;
                    } else if (index === currentImageIndex) {
                      barProgress = mediaIsVideo ? 100 : progress;
                    }
                    return (
                      <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white"
                          style={{ 
                            width: `${barProgress}%`,
                            transition: mediaIsVideo || index !== currentImageIndex ? 'none' : 'width 100ms linear'
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Header */}
                <div className="absolute top-8 left-0 right-0 z-20 flex items-center justify-between px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-primary to-emerald-400">
                      <div 
                        className="w-full h-full rounded-full border-2 border-black bg-cover bg-center"
                        style={{ backgroundImage: `url('${authorAvatarUrl || "/placeholder.svg"}')` }}
                      />
                    </div>
                    <div>
                      {isEditingTitle && isOwnProfile ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            onKeyDown={handleTitleKeyDown}
                            className="text-sm font-semibold max-w-[150px] h-7 bg-white/10 border-white/20 text-white"
                            autoFocus
                          />
                          <button
                            onClick={handleTitleSave}
                            disabled={updateHighlight.isPending}
                            className="w-6 h-6 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleTitleClick}
                          className={`flex items-center gap-1 group ${isOwnProfile ? 'cursor-pointer' : 'cursor-default'}`}
                          disabled={!isOwnProfile}
                        >
                          <p className="text-white text-sm font-semibold">{selectedHighlight?.title}</p>
                          {isOwnProfile && (
                            <Pencil className="w-3 h-3 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      )}
                      <p className="text-white/60 text-xs">
                        {currentHighlightIndex + 1}/{displayHighlights.length} destaques
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={handleShare}
                      className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                    {isOwnProfile && (
                      <button 
                        onClick={() => setDeleteDialogOpen(true)}
                        className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      onClick={onClose}
                      className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Media Carousel */}
                <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
                  <div ref={imageEmblaRef} className="w-full h-full overflow-hidden">
                    <div className="flex h-full">
                      {currentImages.map((media, index) => {
                        const hasError = mediaErrors[media.id] || isUnsupportedFormat(media.image_url);
                        return (
                          <div key={media.id} className="flex-none w-full h-full flex items-center justify-center">
                            {hasError ? (
                              <div className="flex flex-col items-center justify-center gap-4 text-white/60">
                                <ImageOff className="w-16 h-16" />
                                <p className="text-sm">Mídia indisponível</p>
                              </div>
                            ) : media.media_type === 'video' ? (
                              <video
                                ref={index === currentImageIndex ? videoRef : undefined}
                                src={media.image_url}
                                className="w-full h-full object-contain"
                                autoPlay={index === currentImageIndex}
                                playsInline
                                muted={index !== currentImageIndex}
                                onEnded={handleVideoEnded}
                                onError={() => setMediaErrors(prev => ({ ...prev, [media.id]: true }))}
                              />
                            ) : (
                              <img
                                src={media.image_url}
                                alt={selectedHighlight?.title || 'Destaque'}
                                className="w-full h-full object-contain"
                                onError={() => setMediaErrors(prev => ({ ...prev, [media.id]: true }))}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation touch zones with pause functionality - Instagram style */}
                  <div 
                    className="absolute inset-0 z-10"
                    onMouseDown={handlePauseStart}
                    onMouseUp={(e) => {
                      handlePauseEnd();
                      handleDoubleTap(e);
                      handleTapNavigation(e);
                    }}
                    onMouseLeave={handlePauseEnd}
                    onTouchStart={handlePauseStart}
                    onTouchEnd={(e) => {
                      handlePauseEnd();
                      handleDoubleTap(e);
                      handleTapNavigation(e);
                    }}
                  />

                  {/* Heart animation on double tap */}
                  <AnimatePresence>
                    {showHeartAnimation && (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Heart className="w-24 h-24 text-red-500 fill-red-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Pause indicator */}
                  {isPaused && !showHeartAnimation && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                        <Pause className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer with gradient */}
                <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-6 bg-gradient-to-t from-black/60 to-transparent">
                  {isOwnProfile ? (
                    // Owner footer: views, likes, replies count and action buttons
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setViewersSheetOpen(true)}
                          className="flex items-center gap-1.5 text-white hover:bg-white/10 px-2.5 py-2 rounded-full transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                          <span className="text-sm font-medium">{viewerCount}</span>
                        </button>
                        <button 
                          onClick={() => setLikesSheetOpen(true)}
                          className="flex items-center gap-1.5 text-white hover:bg-white/10 px-2.5 py-2 rounded-full transition-colors"
                        >
                          <Heart className="w-5 h-5" />
                          <span className="text-sm font-medium">{likeCount}</span>
                        </button>
                        <button 
                          onClick={() => setRepliesSheetOpen(true)}
                          className="flex items-center gap-1.5 text-white hover:bg-white/10 px-2.5 py-2 rounded-full transition-colors"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">{replyCount}</span>
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {currentImages.length > 1 && (
                          <button 
                            onClick={() => {
                              setSelectedImageToDelete(currentImages[currentImageIndex]);
                              setDeleteImageDialogOpen(true);
                            }}
                            className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-2 rounded-full transition-colors"
                          >
                            <X className="w-5 h-5" />
                            <span className="text-sm font-medium">Remover mídia</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Visitor footer: reply input and like button
                    <div className="flex items-center gap-3">
                      <div className="flex-1 relative">
                        <Input
                          ref={replyInputRef}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Enviar mensagem..."
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-10 rounded-full"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleReplySubmit();
                            }
                          }}
                          onFocus={() => setIsPaused(true)}
                          onBlur={() => setIsPaused(false)}
                        />
                        {replyText.trim() && (
                          <button
                            onClick={handleReplySubmit}
                            disabled={sendReply.isPending}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:text-primary transition-colors"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      <button
                        onClick={handleLike}
                        disabled={toggleLike.isPending}
                        className="flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-full transition-all active:scale-90"
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={isLiked ? "liked" : "unliked"}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                          >
                            <Heart 
                              className={`w-6 h-6 transition-colors ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`}
                            />
                          </motion.div>
                        </AnimatePresence>
                      </button>
                    </div>
                  )}
                </div>

                {/* Highlight dots */}
                {displayHighlights.length > 1 && (
                  <div className={`absolute left-0 right-0 z-20 flex justify-center ${isOwnProfile ? 'bottom-20' : 'bottom-24'}`}>
                    <div className="flex gap-2">
                      {displayHighlights.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => highlightEmblaApi?.scrollTo(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentHighlightIndex ? 'bg-white' : 'bg-white/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        </>
      )}

      {/* Share to Chat Sheet */}
      <ShareToChatSheet
        open={shareToChatSheetOpen}
        onOpenChange={setShareToChatSheetOpen}
        contentType="highlight"
        contentId={selectedHighlight?.id || ''}
        contentUrl={shareUrl}
        contentPreview={currentImages[0]?.image_url}
        contentTitle={selectedHighlight?.title}
      />

      {/* Highlight Viewers Sheet */}
      {isOwnProfile && selectedHighlight && (
        <HighlightViewersSheet
          highlightId={selectedHighlight.id}
          isOpen={viewersSheetOpen}
          onClose={() => setViewersSheetOpen(false)}
        />
      )}

      {/* Highlight Replies Sheet */}
      {isOwnProfile && selectedHighlight && (
        <HighlightRepliesSheet
          highlightId={selectedHighlight.id}
          isOpen={repliesSheetOpen}
          onClose={() => setRepliesSheetOpen(false)}
        />
      )}

      {/* Highlight Likes Sheet */}
      {isOwnProfile && selectedHighlight && (
        <HighlightLikesSheet
          highlightId={selectedHighlight.id}
          isOpen={likesSheetOpen}
          onClose={() => setLikesSheetOpen(false)}
        />
      )}
    </AnimatePresence>
  );
};