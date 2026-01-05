import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLikePost, useSavePost, useDeletePost, type Post } from "@/hooks/usePosts";
import { usePostLikes } from "@/hooks/usePostLikes";
import { useIsMobile } from "@/hooks/use-mobile";
import { ClappingHandsIcon } from "@/components/icons/ClappingHandsIcon";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LikesSheet } from "@/components/feed/LikesSheet";
import { CommentsSheet } from "@/components/feed/CommentsSheet";
import { ShareToChatSheet } from "@/components/common/ShareToChatSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoControls } from "@/components/feed/VideoControls";
import { ResponsiveAlertModal } from "@/components/ui/responsive-modal";
import { Send, Bookmark, MessageCircle, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ProfilePost {
  id: string;
  media_url: string | null;
  media_type: string | null;
  content: string;
  created_at?: string;
  user_id?: string;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  location_name?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  music_track_id?: string | null;
  music_start_seconds?: number | null;
  music_end_seconds?: number | null;
  liked_by_user?: boolean;
  saved_by_user?: boolean;
}

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  nickname?: string | null;
  avatar_url: string | null;
  conta_verificada?: boolean;
  gender?: string | null;
  role?: string | null;
  posicaomas?: number | null;
  posicaofem?: number | null;
  funcao?: number | null;
  position_name?: string | null;
}

interface ProfileMediaViewerProps {
  posts: ProfilePost[];
  initialPostIndex: number;
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  originRect?: DOMRect | null;
}

export const ProfileMediaViewer = ({
  posts,
  initialPostIndex,
  isOpen,
  onClose,
  profile,
  originRect,
}: ProfileMediaViewerProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const [currentPostIndex, setCurrentPostIndex] = useState(Math.max(0, initialPostIndex));
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showLikesSheet, setShowLikesSheet] = useState(false);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showDoubleTapAnimation, setShowDoubleTapAnimation] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [showVideoControls, setShowVideoControls] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const currentPost = posts[currentPostIndex];
  const isOwnProfile = user?.id === profile.id;

  // Local optimistic state for like/save
  const [isLikedLocal, setIsLikedLocal] = useState(currentPost?.liked_by_user ?? false);
  const [isSavedLocal, setIsSavedLocal] = useState(currentPost?.saved_by_user ?? false);
  const [likesCountLocal, setLikesCountLocal] = useState(currentPost?.likes_count ?? 0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef<number>(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const initialPinchDistance = useRef<number | null>(null);
  const initialScale = useRef<number>(1);
  const lastPosition = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const swipeStartY = useRef<number | null>(null);

  // Hooks for interactions
  const likePost = useLikePost();
  const savePost = useSavePost();
  const deletePost = useDeletePost();
  const { data: likers = [] } = usePostLikes(currentPost?.id || "", isOpen && likesCountLocal > 0);

  // Sync with post changes
  useEffect(() => {
    if (currentPost) {
      setIsLikedLocal(currentPost.liked_by_user ?? false);
      setIsSavedLocal(currentPost.saved_by_user ?? false);
      setLikesCountLocal(currentPost.likes_count ?? 0);
      setCurrentMediaIndex(0);
      setMediaLoaded(false);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [currentPostIndex, currentPost]);

  useEffect(() => {
    if (isOpen && initialPostIndex >= 0) {
      setCurrentPostIndex(initialPostIndex);
      setCurrentMediaIndex(0);
      setMediaLoaded(false);
      setShowInfo(true);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      document.body.style.overflow = "hidden";
    } else if (!isOpen) {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, initialPostIndex]);

  // Get media URLs from post
  const getMediaUrls = useCallback((): string[] => {
    if (!currentPost?.media_url) return [];
    try {
      const parsed = JSON.parse(currentPost.media_url);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Not JSON, single URL
    }
    return [currentPost.media_url];
  }, [currentPost]);

  const mediaUrls = getMediaUrls();
  const isCarousel = mediaUrls.length > 1;
  const isVideo = currentPost?.media_type === "video";

  // Transform post for sheets
  const transformedPost: Post = {
    id: currentPost?.id || "",
    content: currentPost?.content || "",
    media_url: currentPost?.media_url || null,
    media_type: currentPost?.media_type || null,
    created_at: currentPost?.created_at || new Date().toISOString(),
    updated_at: currentPost?.created_at || new Date().toISOString(),
    user_id: currentPost?.user_id || profile.id,
    likes_count: currentPost?.likes_count || 0,
    comments_count: currentPost?.comments_count || 0,
    shares_count: currentPost?.shares_count || 0,
    location_name: currentPost?.location_name,
    location_lat: currentPost?.location_lat,
    location_lng: currentPost?.location_lng,
    music_track_id: currentPost?.music_track_id,
    music_start_seconds: currentPost?.music_start_seconds,
    music_end_seconds: currentPost?.music_end_seconds,
    music_track: null,
    profile: {
      id: profile.id,
      username: profile.username,
      full_name: profile.full_name,
      nickname: profile.nickname || profile.full_name || "",
      avatar_url: profile.avatar_url,
      team: "",
      conta_verificada: profile.conta_verificada || false,
      gender: profile.gender || null,
      role: profile.role || null,
      posicaomas: profile.posicaomas || null,
      posicaofem: profile.posicaofem || null,
      funcao: profile.funcao || null,
      position_name: profile.position_name || null,
    },
    liked_by_user: currentPost?.liked_by_user ?? false,
    saved_by_user: currentPost?.saved_by_user ?? false,
    recent_likes: [],
  };

  // Pinch-to-zoom handlers
  const getDistance = (touches: React.TouchList) => {
    const [touch1, touch2] = [touches[0], touches[1]];
    return Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      initialPinchDistance.current = getDistance(e.touches);
      initialScale.current = scale;
    } else if (e.touches.length === 1) {
      if (scale > 1) {
        isPanning.current = true;
        lastPosition.current = {
          x: e.touches[0].clientX - position.x,
          y: e.touches[0].clientY - position.y,
        };
      } else {
        swipeStartY.current = e.touches[0].clientY;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance.current !== null) {
      e.preventDefault();
      const currentDistance = getDistance(e.touches);
      const newScale = Math.min(Math.max(initialScale.current * (currentDistance / initialPinchDistance.current), 1), 4);
      setScale(newScale);
      if (newScale > 1) setShowInfo(false);
    } else if (e.touches.length === 1 && isPanning.current && scale > 1) {
      e.preventDefault();
      const newX = e.touches[0].clientX - lastPosition.current.x;
      const newY = e.touches[0].clientY - lastPosition.current.y;
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
      isPanning.current = false;

      // Handle vertical swipe to navigate between posts
      if (swipeStartY.current !== null && scale === 1) {
        const endY = e.changedTouches[0]?.clientY || 0;
        const deltaY = endY - swipeStartY.current;
        const threshold = 80;

        if (deltaY < -threshold && currentPostIndex < posts.length - 1) {
          setCurrentPostIndex((prev) => prev + 1);
        } else if (deltaY > threshold && currentPostIndex > 0) {
          setCurrentPostIndex((prev) => prev - 1);
        }
      }
      swipeStartY.current = null;

      if (scale <= 1) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  const handleLike = useCallback(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!currentPost) return;

    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 300);

    const wasLiked = isLikedLocal;
    setIsLikedLocal(!wasLiked);
    setLikesCountLocal((prev) => (wasLiked ? prev - 1 : prev + 1));

    likePost.mutate(
      { postId: currentPost.id, isLiked: wasLiked },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["post-likes", currentPost.id] });
          queryClient.invalidateQueries({ queryKey: ["posts"] });
          queryClient.invalidateQueries({ queryKey: ["user-posts"] });
        },
      }
    );
  }, [user, navigate, likePost, currentPost, isLikedLocal, queryClient]);

  const handleDoubleTapLike = useCallback(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!currentPost) return;

    setShowDoubleTapAnimation(true);
    setTimeout(() => setShowDoubleTapAnimation(false), 1000);

    if (!isLikedLocal) {
      setIsLikedLocal(true);
      setLikesCountLocal((prev) => prev + 1);
      likePost.mutate(
        { postId: currentPost.id, isLiked: false },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["post-likes", currentPost.id] });
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            queryClient.invalidateQueries({ queryKey: ["user-posts"] });
          },
        }
      );
    }
  }, [user, navigate, likePost, currentPost, isLikedLocal, queryClient]);

  const handleSave = useCallback(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!currentPost) return;

    setIsSavedLocal(!isSavedLocal);
    savePost.mutate(
      { postId: currentPost.id, isSaved: isSavedLocal },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["posts"] });
          queryClient.invalidateQueries({ queryKey: ["user-posts"] });
        },
      }
    );
  }, [user, navigate, savePost, currentPost, isSavedLocal, queryClient]);

  const handleDelete = useCallback(() => {
    if (!currentPost) return;
    
    deletePost.mutate(currentPost.id, {
      onSuccess: () => {
        toast.success("Publicação excluída com sucesso");
        setShowDeleteDialog(false);
        // If it was the last post, close the viewer
        if (posts.length === 1) {
          onClose();
        } else if (currentPostIndex >= posts.length - 1) {
          // If deleting the last post in array, go to previous
          setCurrentPostIndex((prev) => Math.max(0, prev - 1));
        }
        queryClient.invalidateQueries({ queryKey: ["user-posts"] });
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      },
      onError: () => {
        toast.error("Erro ao excluir publicação");
      },
    });
  }, [currentPost, deletePost, posts.length, currentPostIndex, onClose, queryClient]);

  const handleTapNavigation = (e: React.MouseEvent | React.TouchEvent) => {
    if (scale > 1) return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      e.preventDefault();
      handleDoubleTapLike();
      lastTapRef.current = 0;
      return;
    }

    lastTapRef.current = now;

    if (!isCarousel) {
      setTimeout(() => {
        if (lastTapRef.current !== now) return;
        setShowInfo((prev) => !prev);
      }, DOUBLE_TAP_DELAY);
      return;
    }

    setTimeout(() => {
      if (lastTapRef.current !== now) return;

      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : (e as React.MouseEvent).clientX;
      const x = clientX - rect.left;
      const width = rect.width;

      if (x < width / 3) {
        setCurrentMediaIndex((prev) => Math.max(0, prev - 1));
      } else if (x > (width * 2) / 3) {
        setCurrentMediaIndex((prev) => Math.min(mediaUrls.length - 1, prev + 1));
      } else {
        setShowInfo((prev) => !prev);
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

  if (!isOpen || !currentPost) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden">
            {/* Overlay */}
            <motion.div
              className="absolute inset-0 bg-background"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Main container */}
            <motion.div
              className="relative w-full h-full sm:w-auto sm:h-auto sm:max-w-md sm:max-h-[90vh] sm:aspect-[9/16] sm:rounded-2xl overflow-hidden"
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
                stiffness: 200,
                damping: 25,
                mass: 0.8,
                opacity: { duration: 0.25 },
              }}
            >
              {/* Media container */}
              <div
                ref={imageContainerRef}
                className={`absolute inset-0 ${isVideo ? "bg-black" : "bg-background"} flex items-center justify-center touch-none`}
                onClick={handleTapNavigation}
                onTouchStart={!isVideo ? handleTouchStart : undefined}
                onTouchMove={!isVideo ? handleTouchMove : undefined}
                onTouchEnd={!isVideo ? handleTouchEnd : undefined}
              >
                {/* Loading skeleton */}
                {!mediaLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Skeleton className={`w-full h-full ${isVideo ? "bg-gray-800" : "bg-muted"}`} />
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
                      key={`${currentPostIndex}-${currentMediaIndex}`}
                      src={mediaUrls[currentMediaIndex]}
                      alt={`Foto ${currentMediaIndex + 1}`}
                      className={`w-full h-full object-contain select-none ${mediaLoaded ? "blur-0" : "blur-md"}`}
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

                {/* Double tap animation */}
                <AnimatePresence>
                  {showDoubleTapAnimation && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <ClappingHandsIcon className="w-24 h-24 animate-applause-burst drop-shadow-lg" filled variant="green" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Post counter */}
              <motion.div
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-foreground/10 backdrop-blur-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                <span className="text-xs font-medium text-foreground">
                  {currentPostIndex + 1} / {posts.length}
                </span>
              </motion.div>

              {/* Carousel indicators */}
              {isCarousel && showInfo && (
                <motion.div
                  className="absolute top-12 left-0 right-0 z-20 flex gap-1 px-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {mediaUrls.map((_, index) => (
                    <div key={index} className="flex-1 h-0.5 rounded-full overflow-hidden bg-muted-foreground/30">
                      <div
                        className={`h-full bg-primary transition-all duration-300 ${
                          index <= currentMediaIndex ? "w-full" : "w-0"
                        }`}
                      />
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Navigation arrows */}
              {currentPostIndex > 0 && (
                <motion.button
                  onClick={() => setCurrentPostIndex((prev) => prev - 1)}
                  className="absolute top-1/2 -translate-y-1/2 left-4 z-20 w-10 h-10 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <ChevronUp className="w-5 h-5 text-foreground" />
                </motion.button>
              )}

              {currentPostIndex < posts.length - 1 && (
                <motion.button
                  onClick={() => setCurrentPostIndex((prev) => prev + 1)}
                  className="absolute top-1/2 -translate-y-1/2 right-4 z-20 w-10 h-10 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <ChevronDown className="w-5 h-5 text-foreground" />
                </motion.button>
              )}

              {/* Header */}
              <AnimatePresence>
                {showInfo && (
                  <motion.div
                    className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {!isVideo && (
                      <button
                        onClick={() => {
                          onClose();
                          navigate(`/${profile.username}`);
                        }}
                        className="flex items-center gap-3"
                      >
                        <Avatar className="w-10 h-10 border-2 border-background">
                          <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-sm text-foreground">
                              {profile.nickname || profile.full_name || profile.username}
                            </span>
                            {profile.conta_verificada && (
                              <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{getTimeAgo(currentPost.created_at || "")}</p>
                        </div>
                      </button>
                    )}
                    {isVideo && <div />}

                    <div className="flex items-center gap-2">
                      {isOwnProfile && (
                        <button
                          onClick={() => setShowDeleteDialog(true)}
                          className="w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors bg-foreground/10 text-foreground hover:bg-foreground/20"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={onClose}
                        className="w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors bg-foreground/10 text-foreground hover:bg-foreground/20"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Close button always visible when info is hidden */}
              {!showInfo && (
                <motion.button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-20 w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center bg-foreground/10 text-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <span className="material-symbols-outlined">close</span>
                </motion.button>
              )}

              {/* Bottom gradient */}
              {!isVideo && showInfo && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background/95 via-background/70 to-transparent z-10 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}

              {/* Footer */}
              <AnimatePresence>
                {!isVideo && showInfo && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 z-20 p-4 space-y-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    {/* Caption */}
                    {currentPost.content && (
                      <p className="text-sm text-foreground line-clamp-2">{currentPost.content}</p>
                    )}

                    {/* Location */}
                    {currentPost.location_name && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${currentPost.location_lat},${currentPost.location_lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        <span className="truncate">{currentPost.location_name}</span>
                      </a>
                    )}

                    {/* Liked by */}
                    {likesCountLocal > 0 && likers.length > 0 && (
                      <div className="pt-1">
                        <button onClick={() => setShowLikesSheet(true)} className="flex items-center gap-2 group text-left">
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
                          <p className="text-sm text-foreground">
                            Aplaudido por{" "}
                            <span className="font-semibold group-hover:underline">{likers[0].username}</span>
                            {likesCountLocal > 1 && (
                              <>
                                {" "}
                                e{" "}
                                <span className="font-semibold group-hover:underline">
                                  {likesCountLocal === 2 ? likers[1]?.username || "outra pessoa" : `outras ${likesCountLocal - 1} pessoas`}
                                </span>
                              </>
                            )}
                          </p>
                        </button>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-4 pt-2 -mx-4">
                      <button
                        onClick={handleLike}
                        disabled={likePost.isPending}
                        className="flex items-center justify-center p-3 gap-1.5 text-foreground transition-all active:scale-110"
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
                        {likesCountLocal > 0 && <span className="text-xs font-medium">{formatNumber(likesCountLocal)}</span>}
                      </button>

                      <div className="flex items-center justify-center relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-px bg-border" />
                        <button
                          onClick={() => setShowCommentsSheet(true)}
                          className="flex items-center justify-center p-3 gap-1.5 text-foreground hover:text-muted-foreground transition-colors"
                        >
                          <MessageCircle className="w-6 h-6" strokeWidth={1.5} />
                          {(currentPost.comments_count ?? 0) > 0 && (
                            <span className="text-xs font-medium">{formatNumber(currentPost.comments_count ?? 0)}</span>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-center relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-px bg-border" />
                        <button
                          onClick={() => setShowShareSheet(true)}
                          className="flex items-center justify-center p-3 gap-1.5 text-foreground hover:text-muted-foreground transition-colors"
                        >
                          <Send className="w-6 h-6" strokeWidth={1.5} />
                          {(currentPost.shares_count ?? 0) > 0 && (
                            <span className="text-xs font-medium">{formatNumber(currentPost.shares_count ?? 0)}</span>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-center relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-px bg-border" />
                        <button
                          onClick={handleSave}
                          disabled={savePost.isPending}
                          className={`flex items-center justify-center p-3 transition-colors ${
                            isSavedLocal ? "text-primary" : "text-foreground hover:text-muted-foreground"
                          }`}
                        >
                          <Bookmark className="w-6 h-6" strokeWidth={1.5} fill={isSavedLocal ? "currentColor" : "none"} />
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

      {/* Sheets */}
      <LikesSheet postId={currentPost?.id || ""} open={showLikesSheet} onOpenChange={setShowLikesSheet} />
      <CommentsSheet post={transformedPost} open={showCommentsSheet} onOpenChange={setShowCommentsSheet} />
      <ShareToChatSheet
        open={showShareSheet}
        onOpenChange={setShowShareSheet}
        contentType="post"
        contentId={currentPost?.id || ""}
        contentUrl={`${window.location.origin}/post/${currentPost?.id}`}
        contentPreview={mediaUrls[0]}
        contentTitle={currentPost?.content?.substring(0, 50) || "Publicação"}
      />

      {/* Delete confirmation dialog */}
      <ResponsiveAlertModal
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Excluir publicação"
        description="Tem certeza que deseja excluir esta publicação? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        confirmVariant="destructive"
      />
    </>
  );
};
