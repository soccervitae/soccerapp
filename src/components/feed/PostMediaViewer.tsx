import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLikePost, type Post } from "@/hooks/usePosts";
import { usePostLikes } from "@/hooks/usePostLikes";
import { useIsMobile } from "@/hooks/use-mobile";
import { ClappingHandsIcon } from "@/components/icons/ClappingHandsIcon";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LikesSheet } from "@/components/feed/LikesSheet";
import { CommentsSheet } from "@/components/feed/CommentsSheet";
import { ShareToChatSheet } from "@/components/common/ShareToChatSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Send } from "lucide-react";

interface PostMediaViewerProps {
  post: Post;
  mediaUrls: string[];
  mediaType: string | null;
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  originRect?: DOMRect | null;
}

export const PostMediaViewer = ({
  post,
  mediaUrls,
  mediaType,
  initialIndex = 0,
  isOpen,
  onClose,
  originRect,
}: PostMediaViewerProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showLikesSheet, setShowLikesSheet] = useState(false);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showDoubleTapAnimation, setShowDoubleTapAnimation] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef<number>(0);

  // Hooks for interactions
  const likePost = useLikePost();
  const { data: likers = [] } = usePostLikes(post.id, isOpen && post.likes_count > 0);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setMediaLoaded(false);
    }
  }, [isOpen, initialIndex]);

  // Reset loaded state when changing media in carousel
  useEffect(() => {
    setMediaLoaded(false);
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

  const handleLike = useCallback(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 300);
    likePost.mutate({
      postId: post.id,
      isLiked: post.liked_by_user,
    });
  }, [user, navigate, likePost, post.id, post.liked_by_user]);

  const handleDoubleTapLike = useCallback(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    // Show animation
    setShowDoubleTapAnimation(true);
    setTimeout(() => setShowDoubleTapAnimation(false), 1000);
    
    // Only like if not already liked
    if (!post.liked_by_user) {
      likePost.mutate({
        postId: post.id,
        isLiked: false,
      });
    }
  }, [user, navigate, likePost, post.id, post.liked_by_user]);

  const handleProfileClick = (username: string) => {
    onClose();
    navigate(`/${username}`);
  };

  const handleTapNavigation = (e: React.MouseEvent | React.TouchEvent) => {
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
    if (!isCarousel) return;
    
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


  return (
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
              {/* Media - fullscreen */}
              <div 
                className="absolute inset-0 bg-white flex items-center justify-center"
                onClick={handleTapNavigation}
              >
                {/* Skeleton placeholder while loading */}
                {!mediaLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Skeleton className="w-full h-full bg-gray-200" />
                  </div>
                )}
                
                {isVideo ? (
                  <video
                    ref={videoRef}
                    src={mediaUrls[0]}
                    className={`w-full h-full object-contain transition-[filter] duration-500 ease-out ${
                      mediaLoaded ? "blur-0 opacity-100" : "blur-md opacity-0"
                    }`}
                    controls
                    autoPlay
                    playsInline
                    onLoadedData={() => setMediaLoaded(true)}
                  />
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentIndex}
                      src={mediaUrls[currentIndex]}
                      alt={`Foto ${currentIndex + 1}`}
                      className={`w-full h-full object-contain ${
                        mediaLoaded ? "blur-0" : "blur-md"
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: mediaLoaded ? 1 : 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      onLoad={() => setMediaLoaded(true)}
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
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Progress bar for carousel */}
              {isCarousel && (
                <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2 pt-3">
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
                </div>
              )}

              {/* Top gradient */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/90 via-white/50 to-transparent z-10 pointer-events-none" />

              {/* Header - overlaid with profile info and close button */}
              <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
                {/* Profile info */}
                <button
                  onClick={() => handleProfileClick(post.profile.username)}
                  className="flex items-center gap-3"
                >
                  {/* Avatar with gradient border */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-pink-500 p-[2px]" />
                    <Avatar className="w-10 h-10 relative border-2 border-white">
                      <AvatarImage src={post.profile.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{post.profile.username[0].toUpperCase()}</AvatarFallback>
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

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-gray-100 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 hover:bg-gray-200 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Bottom gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white/95 via-white/70 to-transparent z-10 pointer-events-none" />

              {/* Footer - overlaid */}
              <div className="absolute bottom-0 left-0 right-0 z-20 p-4 space-y-3">
                {/* Caption */}
                {post.content && (
                  <p className="text-sm text-gray-900 line-clamp-2">
                    {post.content}
                  </p>
                )}

                {/* Location */}
                {post.location_name && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${post.location_lat},${post.location_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    <span className="truncate">{post.location_name}</span>
                  </a>
                )}


                {/* Applauded by section */}
                {post.likes_count > 0 && (
                  <button
                    onClick={() => setShowLikesSheet(true)}
                    className="flex items-center gap-2 text-left"
                  >
                    {/* Stacked avatars */}
                    {likers.length > 0 && (
                      <div className="flex -space-x-2">
                        {likers.slice(0, 3).map((liker, index) => (
                          <Avatar 
                            key={liker.user_id} 
                            className="w-5 h-5 border border-gray-100"
                            style={{ zIndex: 3 - index }}
                          >
                            <AvatarImage src={liker.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback className="text-[8px]">
                              {liker.username[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    )}
                    <span className="text-xs text-gray-700">
                      {likers.length > 0 ? (
                        <>
                          Aplaudido por{" "}
                          <span className="font-semibold">{likers[0]?.username}</span>
                          {post.likes_count > 1 && (
                            <> e <span className="font-semibold">outros {post.likes_count - 1}</span></>
                          )}
                        </>
                      ) : (
                        <span className="font-semibold">{formatNumber(post.likes_count)} aplausos</span>
                      )}
                    </span>
                  </button>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-4">
                    {/* Like button */}
                    <button
                      onClick={handleLike}
                      disabled={likePost.isPending}
                      className="flex items-center gap-1.5 transition-all active:scale-110"
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={post.liked_by_user ? "liked" : "unliked"}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                        >
                          <ClappingHandsIcon
                            className={`w-7 h-7 ${isLikeAnimating ? "animate-applause-pop" : ""}`}
                            filled={post.liked_by_user}
                          />
                        </motion.div>
                      </AnimatePresence>
                      {post.likes_count > 0 && (
                        <span className="text-sm font-medium text-gray-900">
                          {formatNumber(post.likes_count)}
                        </span>
                      )}
                    </button>

                    {/* Comment button */}
                    <button
                      onClick={() => setShowCommentsSheet(true)}
                      className="flex items-center gap-1.5 text-gray-900 hover:text-gray-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[26px]">chat_bubble_outline</span>
                      {post.comments_count > 0 && (
                        <span className="text-sm font-medium">
                          {formatNumber(post.comments_count)}
                        </span>
                      )}
                    </button>

                    {/* Share button */}
                    <button
                      onClick={() => setShowShareSheet(true)}
                      className="flex items-center gap-1.5 text-gray-900 hover:text-gray-600 transition-colors"
                    >
                      <Send className="w-6 h-6" />
                      {(post.shares_count ?? 0) > 0 && (
                        <span className="text-sm font-medium">
                          {formatNumber(post.shares_count ?? 0)}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Likes Sheet */}
      <LikesSheet
        postId={post.id}
        open={showLikesSheet}
        onOpenChange={setShowLikesSheet}
      />

      {/* Comments Sheet */}
      <CommentsSheet
        post={post}
        open={showCommentsSheet}
        onOpenChange={setShowCommentsSheet}
      />

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
    </>
  );
};
