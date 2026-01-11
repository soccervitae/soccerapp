import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLikePost, useSavePost, useUpdatePost, useDeletePost, useReportPost, type Post } from "@/hooks/usePosts";
import { useThemeColor } from "@/hooks/useThemeColor";
import { usePostLikes } from "@/hooks/usePostLikes";
import { useIsMobile } from "@/hooks/use-mobile";
import { ClappingHandsIcon } from "@/components/icons/ClappingHandsIcon";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LikesSheet } from "@/components/feed/LikesSheet";
import { CommentsSheet } from "@/components/feed/CommentsSheet";
import { ShareToChatSheet } from "@/components/common/ShareToChatSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoControls } from "@/components/feed/VideoControls";
import { Send, Bookmark, MessageCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ResponsiveAlertModal } from "@/components/ui/responsive-modal";

const REPORT_REASONS = [
  { value: "spam", label: "Spam ou conteúdo enganoso" },
  { value: "inappropriate", label: "Conteúdo impróprio" },
  { value: "harassment", label: "Assédio ou bullying" },
  { value: "violence", label: "Violência ou ameaças" },
  { value: "other", label: "Outro motivo" },
];

interface PostMediaViewerProps {
  post: Post;
  mediaUrls: string[];
  mediaType: string | null;
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  originRect?: DOMRect | null;
  // Navigation between posts
  posts?: Post[];
  currentPostIndex?: number;
  onNavigatePost?: (index: number) => void;
}

export const PostMediaViewer = ({
  post,
  mediaUrls,
  mediaType,
  initialIndex = 0,
  isOpen,
  onClose,
  originRect,
  posts,
  currentPostIndex = 0,
  onNavigatePost,
}: PostMediaViewerProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  
  // Dynamic theme color for iOS status bar
  useThemeColor(isOpen, "#000000");
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showLikesSheet, setShowLikesSheet] = useState(false);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showDoubleTapAnimation, setShowDoubleTapAnimation] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [showVideoControls, setShowVideoControls] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [scale, setScale] = useState(1);
  
  // Edit/Delete/Report dialogs
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  
  // Local optimistic state for like/save
  const [isLikedLocal, setIsLikedLocal] = useState(post.liked_by_user);
  const [isSavedLocal, setIsSavedLocal] = useState(post.saved_by_user);
  const [likesCountLocal, setLikesCountLocal] = useState(post.likes_count);
  
  // Sync with prop changes
  useEffect(() => {
    setIsLikedLocal(post.liked_by_user);
    setIsSavedLocal(post.saved_by_user);
    setLikesCountLocal(post.likes_count);
    setEditContent(post.content);
  }, [post.liked_by_user, post.saved_by_user, post.likes_count, post.content]);
  
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef<number>(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const initialPinchDistance = useRef<number | null>(null);
  const initialScale = useRef<number>(1);
  const lastPosition = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);
  
  // Swipe navigation for posts
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const hasNavigatedPost = useRef(false);
  const canNavigatePosts = !!posts && posts.length > 1 && !!onNavigatePost;

  // Hooks for interactions
  const likePost = useLikePost();
  const savePost = useSavePost();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const reportPost = useReportPost();
  const { data: likers = [] } = usePostLikes(post.id, isOpen && likesCountLocal > 0);
  
  const isOwner = user?.id === post.user_id;

  const handleEdit = () => {
    setEditContent(post.content);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    updatePost.mutate(
      { postId: post.id, content: editContent },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: ["posts"] });
        },
      }
    );
  };

  const handleDelete = () => {
    deletePost.mutate(post.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        onClose();
      },
    });
  };

  const handleReport = () => {
    if (!reportReason) return;
    reportPost.mutate(
      { postId: post.id, reason: reportReason, description: reportDescription },
      {
        onSuccess: () => {
          setIsReportDialogOpen(false);
          setReportReason("");
          setReportDescription("");
        },
      }
    );
  };

  useEffect(() => {
    console.log("[PostMediaViewer] isOpen change", {
      isOpen,
      postId: post?.id,
      mediaUrlsCount: mediaUrls?.length,
      mediaType,
    });

    if (isOpen) {
      setCurrentIndex(initialIndex);
      setMediaLoaded(false);
      setShowInfo(false);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex, post?.id, mediaType, mediaUrls?.length]);

  // Reset loaded state when changing media in carousel
  useEffect(() => {
    setMediaLoaded(false);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Pinch-to-zoom handlers
  const getDistance = (touches: React.TouchList) => {
    const [touch1, touch2] = [touches[0], touches[1]];
    return Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
  };

  const getMidpoint = (touches: React.TouchList) => {
    const [touch1, touch2] = [touches[0], touches[1]];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      initialPinchDistance.current = getDistance(e.touches);
      initialScale.current = scale;
    } else if (e.touches.length === 1) {
      // Track swipe start for post navigation
      swipeStartX.current = e.touches[0].clientX;
      swipeStartY.current = e.touches[0].clientY;
      hasNavigatedPost.current = false;
      
      if (scale > 1) {
        isPanning.current = true;
        lastPosition.current = {
          x: e.touches[0].clientX - position.x,
          y: e.touches[0].clientY - position.y,
        };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance.current !== null) {
      e.preventDefault();
      const currentDistance = getDistance(e.touches);
      const newScale = Math.min(Math.max(initialScale.current * (currentDistance / initialPinchDistance.current), 1), 4);
      setScale(newScale);
      
      // Hide info when zooming
      if (newScale > 1) {
        setShowInfo(false);
      }
    } else if (e.touches.length === 1 && isPanning.current && scale > 1) {
      e.preventDefault();
      const newX = e.touches[0].clientX - lastPosition.current.x;
      const newY = e.touches[0].clientY - lastPosition.current.y;
      
      // Limit panning based on scale
      const maxPan = (scale - 1) * 150;
      setPosition({
        x: Math.min(Math.max(newX, -maxPan), maxPan),
        y: Math.min(Math.max(newY, -maxPan), maxPan),
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      initialPinchDistance.current = null;
    }
    if (e.touches.length === 0) {
      // Handle swipe for post navigation
      if (
        canNavigatePosts &&
        scale === 1 &&
        !isCarousel &&
        swipeStartX.current !== null &&
        !hasNavigatedPost.current
      ) {
        const endX = e.changedTouches[0]?.clientX ?? swipeStartX.current;
        const endY = e.changedTouches[0]?.clientY ?? swipeStartY.current ?? 0;
        const deltaX = endX - swipeStartX.current;
        const deltaY = endY - (swipeStartY.current ?? 0);
        
        // Check if horizontal swipe is dominant and above threshold
        const swipeThreshold = 50;
        if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
          if (deltaX < 0 && currentPostIndex < (posts?.length ?? 0) - 1) {
            // Swipe left - next post
            onNavigatePost?.(currentPostIndex + 1);
            hasNavigatedPost.current = true;
          } else if (deltaX > 0 && currentPostIndex > 0) {
            // Swipe right - previous post
            onNavigatePost?.(currentPostIndex - 1);
            hasNavigatedPost.current = true;
          }
        }
      }
      
      swipeStartX.current = null;
      swipeStartY.current = null;
      isPanning.current = false;
      
      // Reset position if scale is back to 1
      if (scale <= 1) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    // Don't toggle info if zoomed
    if (scale > 1) return;
    // Toggle info visibility
    setShowInfo(prev => !prev);
  };

  const handleLike = useCallback(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 300);
    
    // Optimistic update
    const wasLiked = isLikedLocal;
    setIsLikedLocal(!wasLiked);
    setLikesCountLocal(prev => wasLiked ? prev - 1 : prev + 1);
    
    likePost.mutate({
      postId: post.id,
      isLiked: wasLiked,
    }, {
      onSuccess: () => {
        // Refresh likers list and posts after like/unlike
        queryClient.invalidateQueries({ queryKey: ["post-likes", post.id] });
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      }
    });
  }, [user, navigate, likePost, post.id, isLikedLocal, queryClient]);

  const handleDoubleTapLike = useCallback(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    // Show animation
    setShowDoubleTapAnimation(true);
    setTimeout(() => setShowDoubleTapAnimation(false), 1000);
    
    // Only like if not already liked
    if (!isLikedLocal) {
      setIsLikedLocal(true);
      setLikesCountLocal(prev => prev + 1);
      likePost.mutate({
        postId: post.id,
        isLiked: false,
      }, {
        onSuccess: () => {
          // Refresh likers list and posts after like
          queryClient.invalidateQueries({ queryKey: ["post-likes", post.id] });
          queryClient.invalidateQueries({ queryKey: ["posts"] });
        }
      });
    }
  }, [user, navigate, likePost, post.id, isLikedLocal, queryClient]);

  const handleSave = useCallback(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    // Optimistic update
    setIsSavedLocal(!isSavedLocal);
    
    savePost.mutate({
      postId: post.id,
      isSaved: isSavedLocal,
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      }
    });
  }, [user, navigate, savePost, post.id, isSavedLocal, queryClient]);

  const handleProfileClick = (username: string) => {
    onClose();
    navigate(`/${username}`);
  };

  const handleTapNavigation = (e: React.MouseEvent | React.TouchEvent) => {
    // Don't navigate if zoomed
    if (scale > 1) return;
    
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      e.preventDefault();
      handleDoubleTapLike();
      lastTapRef.current = 0;
      return;
    }
    
    lastTapRef.current = now;
    
    // Single tap for carousel navigation (with delay to check for double tap)
    if (!isCarousel) {
      // For non-carousel, toggle info on single tap
      setTimeout(() => {
        if (lastTapRef.current !== now) return;
        handleImageClick(e as React.MouseEvent);
      }, DOUBLE_TAP_DELAY);
      return;
    }
    
    setTimeout(() => {
      if (lastTapRef.current !== now) return; // Double tap occurred, skip navigation
      
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : (e as React.MouseEvent).clientX;
      const x = clientX - rect.left;
      const width = rect.width;
      
      if (x < width / 3) {
        // Left third - previous
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (x > (width * 2) / 3) {
        // Right two thirds - next
        setCurrentIndex((prev) => Math.min(mediaUrls.length - 1, prev + 1));
      } else {
        // Middle third - toggle info
        handleImageClick(e as React.MouseEvent);
      }
    }, DOUBLE_TAP_DELAY);
  };

  const getInitialPosition = () => {
    if (!originRect) {
      return { opacity: 0, scale: 0.9, borderRadius: "16px" };
    }

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const originCenterX = originRect.left + originRect.width / 2;
    const originCenterY = originRect.top + originRect.height / 2;

    return {
      opacity: 0,
      scale: Math.min(originRect.width / window.innerWidth, 0.2),
      x: originCenterX - centerX,
      y: originCenterY - centerY,
      borderRadius: "16px",
    };
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return "agora";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} d`;
    return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(".0", "") + "k";
    }
    return num.toString();
  };

  const isCarousel = mediaUrls.length > 1;
  const isVideo = mediaType === "video";


  if (typeof document === "undefined") return null;

  const content = (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden">
            {/* Overlay */}
            <motion.div
              className="absolute inset-0 bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Main container - story style */}
            <motion.div
              className="relative w-full h-full sm:w-auto sm:h-auto sm:max-w-md sm:max-h-[90vh] sm:aspect-[9/16] sm:rounded-2xl overflow-hidden"
              style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
              initial={getInitialPosition()}
              animate={{
                opacity: 1,
                scale: 1,
                x: 0,
                y: 0,
                borderRadius: isMobile ? "0px" : "16px",
              }}
              exit={getInitialPosition()}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 28,
                mass: 0.9,
                opacity: { duration: 0.3 },
              }}
            >
              {/* Media - fullscreen */}
              <div
                ref={imageContainerRef}
                className={`absolute inset-0 ${isVideo ? "bg-black" : "bg-white"} flex items-center justify-center touch-none`}
                onClick={handleTapNavigation}
                onTouchStart={!isVideo ? handleTouchStart : undefined}
                onTouchMove={!isVideo ? handleTouchMove : undefined}
                onTouchEnd={!isVideo ? handleTouchEnd : undefined}
              >
                {/* Skeleton placeholder while loading */}
                {!mediaLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Skeleton className={`w-full h-full ${isVideo ? "bg-gray-800" : "bg-gray-200"}`} />
                  </div>
                )}

                {isVideo ? (
                  <>
                    <video
                      ref={videoRef}
                      src={mediaUrls[0]}
                      className={`w-full h-full object-contain transition-[filter] duration-500 ease-out ${
                        mediaLoaded ? "blur-0 opacity-100" : "blur-md opacity-0"
                      }`}
                      autoPlay
                      playsInline
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowVideoControls(true);
                      }}
                      onLoadedData={() => setMediaLoaded(true)}
                    />
                    <VideoControls
                      videoRef={videoRef}
                      isVisible={showVideoControls}
                      onVisibilityChange={setShowVideoControls}
                    />
                  </>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentIndex}
                      src={mediaUrls[currentIndex]}
                      alt={`Foto ${currentIndex + 1}`}
                      className={`w-full h-full object-contain select-none ${
                        mediaLoaded ? "blur-0" : "blur-md"
                      }`}
                      style={{
                        transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                        transition: scale === 1 ? "transform 0.2s ease-out" : "none",
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: mediaLoaded ? 1 : 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      onLoad={() => setMediaLoaded(true)}
                      draggable={false}
                    />
                  </AnimatePresence>
                )}

                {/* Double tap applause animation */}
                <AnimatePresence>
                  {showDoubleTapAnimation && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <ClappingHandsIcon
                        className="w-24 h-24 animate-applause-burst drop-shadow-lg"
                        filled={true}
                        variant="green"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Progress bar for carousel */}
              {isCarousel && showInfo && (
                <motion.div
                  className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2 pt-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {mediaUrls.map((_, index) => (
                    <div
                      key={index}
                      className="flex-1 h-0.5 rounded-full overflow-hidden bg-gray-300"
                    >
                      <div
                        className={`h-full bg-emerald-500 transition-all duration-300 ${
                          index < currentIndex
                            ? "w-full"
                            : index === currentIndex
                              ? "w-full"
                              : "w-0"
                        }`}
                      />
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Top gradient - only for non-video and when info is shown */}
              {!isVideo && showInfo && (
                <motion.div
                  className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/90 via-white/50 to-transparent z-10 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}

              {/* Header - overlaid with profile info and close button */}
              <AnimatePresence>
                {showInfo && (
                  <motion.div
                    className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Profile info - hidden for video */}
                    {!isVideo && (
                      <button
                        onClick={() => handleProfileClick(post.profile.username)}
                        className="flex items-center gap-3"
                      >
                        {/* Avatar with gradient border */}
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-pink-500 p-[2px]" />
                          <Avatar className="w-10 h-10 relative border-2 border-white">
                            <AvatarImage src={post.profile.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {(post.profile.username?.[0] ?? "?").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-sm text-gray-900">
                              {post.profile.nickname || post.profile.full_name || post.profile.username}
                            </span>
                            {post.profile.conta_verificada && (
                              <span className="material-symbols-outlined text-[14px] text-emerald-500">verified</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">{getTimeAgo(post.created_at)}</p>
                        </div>
                      </button>
                    )}
                    {isVideo && <div />}

                    {/* Right side: Close button + Options menu */}
                    <div className="flex items-center gap-2">
                      {/* Three dots menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={`w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors ${
                              isVideo
                                ? "bg-black/50 text-white hover:bg-black/70"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 z-[70]">
                          {isOwner ? (
                            <>
                              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                                <span className="material-symbols-outlined text-[18px] mr-2">edit</span>
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setIsDeleteDialogOpen(true)}
                                className="cursor-pointer text-primary focus:text-primary"
                              >
                                <span className="material-symbols-outlined text-[18px] mr-2">delete</span>
                                Excluir
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => setIsReportDialogOpen(true)}
                              className="cursor-pointer text-destructive focus:text-destructive"
                            >
                              <span className="material-symbols-outlined text-[18px] mr-2">flag</span>
                              Denunciar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Close button */}
                      <button
                        onClick={onClose}
                        className={`w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors ${
                          isVideo
                            ? "bg-black/50 text-white hover:bg-black/70"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                      >
                        <span className="material-symbols-outlined">arrow_back</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Close button always visible when info is hidden */}
              {!showInfo && (
                <motion.button
                  onClick={onClose}
                  className="absolute top-4 left-4 z-20 w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors bg-black/50 text-white hover:bg-black/70"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </motion.button>
              )}

              {/* Bottom gradient - only for non-video and when info is shown */}
              {!isVideo && showInfo && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white/95 via-white/70 to-transparent z-10 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}

              {/* Footer - overlaid */}
              <AnimatePresence>
                {showInfo && (
                  <motion.div
                    className={`absolute bottom-0 left-0 right-0 z-20 p-4 space-y-3 ${
                      isVideo ? "bg-gradient-to-t from-black/80 via-black/50 to-transparent" : ""
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Caption */}
                    {post.content && (
                      <p className={`text-sm line-clamp-2 ${isVideo ? "text-white" : "text-gray-900"}`}>{post.content}</p>
                    )}

                    {/* Location */}
                    {post.location_name && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${post.location_lat},${post.location_lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1 text-xs transition-colors ${
                          isVideo ? "text-white/80 hover:text-white" : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        <span className="truncate">{post.location_name}</span>
                      </a>
                    )}

                    {/* Applauded by section */}
                    {likesCountLocal > 0 && likers.length > 0 && (
                      <div className="pt-1 pb-1">
                        <button
                          onClick={() => setShowLikesSheet(true)}
                          className="flex items-center gap-2 group text-left"
                        >
                          {/* Stacked avatars */}
                          <div className="flex -space-x-2">
                            {likers.slice(0, 3).map((liker, index) => (
                              <img
                                key={liker.user_id}
                                src={liker.avatar_url || "/placeholder.svg"}
                                alt={liker.username}
                                className="w-6 h-6 rounded-full border-2 border-background object-cover"
                                style={{ zIndex: 3 - index }}
                              />
                            ))}
                          </div>

                          {/* Text */}
                          <p className={`text-sm ${isVideo ? "text-white" : "text-foreground"}`}>
                            Aplaudido por{" "}
                            <span
                              className="font-semibold group-hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/${likers[0].username}`);
                              }}
                            >
                              {likers[0].username}
                            </span>
                            {likesCountLocal > 1 && (
                              <>
                                {" "}e{" "}
                                <span className="font-semibold group-hover:underline">
                                  {likesCountLocal === 2
                                    ? likers[1]?.username || "outra pessoa"
                                    : `outras ${likesCountLocal - 1} pessoas`}
                                </span>
                              </>
                            )}
                          </p>
                        </button>
                      </div>
                    )}

                    {/* Actions - same layout as FeedPost */}
                    <div className="grid grid-cols-4 pt-2 -mx-4">
                      {/* Like button */}
                      <button
                        onClick={handleLike}
                        disabled={likePost.isPending}
                        className={`flex items-center justify-center p-3 gap-1.5 transition-all active:scale-110 ${
                          isVideo ? "text-white" : "text-foreground"
                        }`}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={isLikedLocal ? "liked" : "unliked"}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                          >
                            <ClappingHandsIcon
                              className={`w-6 h-6 ${isLikeAnimating ? "animate-applause-pop" : ""}`}
                              filled={isLikedLocal}
                              variant="green"
                            />
                          </motion.div>
                        </AnimatePresence>
                        {likesCountLocal > 0 && (
                          <span className={`text-xs font-medium ${isVideo ? "text-white" : "text-foreground"}`}>
                            {formatNumber(likesCountLocal)}
                          </span>
                        )}
                      </button>

                      {/* Comment button */}
                      <div className="flex items-center justify-center relative">
                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-px ${isVideo ? "bg-white/30" : "bg-border"}`}></div>
                        <button
                          onClick={() => setShowCommentsSheet(true)}
                          className={`flex items-center justify-center p-3 gap-1.5 transition-colors ${
                            isVideo ? "text-white hover:text-white/80" : "text-foreground hover:text-muted-foreground"
                          }`}
                        >
                          <MessageCircle className="w-6 h-6" strokeWidth={1.5} />
                          {post.comments_count > 0 && (
                            <span className="text-xs font-medium">
                              {formatNumber(post.comments_count)}
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Share button */}
                      <div className="flex items-center justify-center relative">
                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-px ${isVideo ? "bg-white/30" : "bg-border"}`}></div>
                        <button
                          onClick={() => setShowShareSheet(true)}
                          className={`flex items-center justify-center p-3 gap-1.5 transition-colors ${
                            isVideo ? "text-white hover:text-white/80" : "text-foreground hover:text-muted-foreground"
                          }`}
                        >
                          <Send className="w-6 h-6" strokeWidth={1.5} />
                          {(post.shares_count ?? 0) > 0 && (
                            <span className="text-xs font-medium">
                              {formatNumber(post.shares_count ?? 0)}
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Save button */}
                      <div className="flex items-center justify-center relative">
                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-px ${isVideo ? "bg-white/30" : "bg-border"}`}></div>
                        <button
                          onClick={handleSave}
                          disabled={savePost.isPending}
                          className={`flex items-center justify-center p-3 transition-colors ${
                            isSavedLocal 
                              ? "text-primary" 
                              : isVideo 
                                ? "text-white hover:text-white/80" 
                                : "text-foreground hover:text-muted-foreground"
                          }`}
                        >
                          <Bookmark
                            className="w-6 h-6"
                            strokeWidth={1.5}
                            fill={isSavedLocal ? "currentColor" : "none"}
                          />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Likes Sheet */}
      <LikesSheet postId={post.id} open={showLikesSheet} onOpenChange={setShowLikesSheet} />

      {/* Comments Sheet */}
      <CommentsSheet post={post} open={showCommentsSheet} onOpenChange={setShowCommentsSheet} />

      {/* Share Sheet */}
      <ShareToChatSheet
        open={showShareSheet}
        onOpenChange={setShowShareSheet}
        contentType="post"
        contentId={post.id}
        contentUrl={`${window.location.origin}/post/${post.id}`}
        contentPreview={mediaUrls[0]}
        contentTitle={post.content?.substring(0, 50) || "Publicação"}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md z-[80]">
          <DialogHeader>
            <DialogTitle>Editar publicação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="O que você está pensando?"
              className="min-h-[100px] resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={updatePost.isPending}>
              {updatePost.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ResponsiveAlertModal
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir publicação"
        description="Tem certeza que deseja excluir esta publicação? Esta ação não pode ser desfeita."
        confirmText={deletePost.isPending ? "Excluindo..." : "Excluir"}
        cancelText="Cancelar"
        onConfirm={handleDelete}
        confirmVariant="destructive"
      />

      {/* Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-md z-[80]">
          <DialogHeader>
            <DialogTitle>Denunciar publicação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <RadioGroup value={reportReason} onValueChange={setReportReason}>
              {REPORT_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value}>{reason.label}</Label>
                </div>
              ))}
            </RadioGroup>
            <Textarea
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Descreva o problema (opcional)"
              className="min-h-[80px] resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleReport}
              disabled={!reportReason || reportPost.isPending}
              variant="destructive"
            >
              {reportPost.isPending ? "Enviando..." : "Denunciar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  return createPortal(content, document.body);
};
