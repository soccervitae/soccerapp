import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X, Pencil, Check, Pause, Share2, Link, Copy, MessageCircle, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserHighlight, HighlightImage } from "@/hooks/useProfile";
import { EmblaCarouselType } from "embla-carousel";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { ShareToChatSheet } from "@/components/common/ShareToChatSheet";
import { useMarkHighlightViewed, useHighlightViewerCount } from "@/hooks/useHighlightInteractions";
import { HighlightViewersSheet } from "@/components/profile/HighlightViewersSheet";
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
}: HighlightFullscreenViewProps) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [shareToChatSheetOpen, setShareToChatSheetOpen] = useState(false);
  const [viewersSheetOpen, setViewersSheetOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  const { user } = useAuth();
  const markViewed = useMarkHighlightViewed();
  const { data: viewerCount = 0 } = useHighlightViewerCount(
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
  const shareText = `Veja o destaque "${selectedHighlight?.title}" no Soccer Vitae!`;

  const handleShare = async () => {
    const shareData = {
      title: `Destaque: ${selectedHighlight?.title}`,
      text: shareText,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      setShareSheetOpen(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copiado!");
      setShareSheetOpen(false);
    } catch {
      toast.error("Erro ao copiar link");
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
      } else {
        onClose();
      }
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
                        style={{ backgroundImage: `url('${selectedHighlight?.image_url}')` }}
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
                      <Share2 className="w-5 h-5" />
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
                      {currentImages.map((media, index) => (
                        <div key={media.id} className="flex-none w-full h-full flex items-center justify-center">
                          {media.media_type === 'video' ? (
                            <video
                              ref={index === currentImageIndex ? videoRef : undefined}
                              src={media.image_url}
                              className="w-full h-full object-contain"
                              autoPlay={index === currentImageIndex}
                              playsInline
                              muted={index !== currentImageIndex}
                              onEnded={handleVideoEnded}
                            />
                          ) : (
                            <img
                              src={media.image_url}
                              alt={selectedHighlight?.title || 'Destaque'}
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Navigation touch zones with pause functionality - Instagram style */}
                  <div 
                    className="absolute inset-0 z-10"
                    onMouseDown={handlePauseStart}
                    onMouseUp={(e) => {
                      handlePauseEnd();
                      handleTapNavigation(e);
                    }}
                    onMouseLeave={handlePauseEnd}
                    onTouchStart={handlePauseStart}
                    onTouchEnd={(e) => {
                      handlePauseEnd();
                      handleTapNavigation(e);
                    }}
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

                {/* Footer with gradient */}
                <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-6 bg-gradient-to-t from-black/60 to-transparent">
                  {isOwnProfile ? (
                    // Owner footer: views count and action buttons
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => setViewersSheetOpen(true)}
                        className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-2 rounded-full transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                        <span className="text-sm font-medium">{viewerCount}</span>
                      </button>
                      
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
                    // Visitor footer: highlight dots
                    <div className="flex justify-center">
                      {displayHighlights.length > 1 && (
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
                      )}
                    </div>
                  )}
                </div>

                {/* Highlight dots for owner too */}
                {isOwnProfile && displayHighlights.length > 1 && (
                  <div className="absolute bottom-20 left-0 right-0 z-20 flex justify-center">
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

          {/* Share Sheet for Desktop */}
          <Sheet open={shareSheetOpen} onOpenChange={setShareSheetOpen}>
            <SheetContent side="bottom" className="z-[70]">
              <SheetHeader>
                <SheetTitle>Compartilhar destaque</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-3 py-4">
                <button 
                  onClick={() => {
                    setShareSheetOpen(false);
                    setShareToChatSheetOpen(true);
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="font-medium">Enviar no chat</span>
                </button>
                <button 
                  onClick={handleCopyLink}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Copy className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Copiar link</span>
                </button>
                <a 
                  href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setShareSheetOpen(false)}
                >
                  <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <span className="font-medium">WhatsApp</span>
                </a>
                <a 
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setShareSheetOpen(false)}
                >
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <span className="font-medium">X (Twitter)</span>
                </a>
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setShareSheetOpen(false)}
                >
                  <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <span className="font-medium">Facebook</span>
                </a>
              </div>
            </SheetContent>
          </Sheet>
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
    </AnimatePresence>
  );
};