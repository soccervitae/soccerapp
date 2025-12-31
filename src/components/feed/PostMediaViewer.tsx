import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLikePost, type Post } from "@/hooks/usePosts";
import { usePostComments, useCreateComment } from "@/hooks/usePosts";
import { usePostLikes } from "@/hooks/usePostLikes";
import { ClappingHandsIcon } from "@/components/icons/ClappingHandsIcon";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [newComment, setNewComment] = useState("");
  const [showLikesSheet, setShowLikesSheet] = useState(false);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const dragY = useMotionValue(0);
  const dragOpacity = useTransform(dragY, [-200, 0, 200], [0.5, 1, 0.5]);
  const dragScale = useTransform(dragY, [-200, 0, 200], [0.9, 1, 0.9]);
  const overlayOpacity = useTransform(dragY, [-200, 0, 200], [0.3, 1, 0.3]);

  // Hooks for interactions
  const likePost = useLikePost();
  const { data: comments = [], refetch: refetchComments } = usePostComments(post.id);
  const createComment = useCreateComment();
  const { data: likes = [] } = usePostLikes(post.id, showLikesSheet);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      refetchComments();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, refetchComments]);

  const handleDragEnd = (_: any, info: { velocity: { y: number }; offset: { y: number } }) => {
    if (Math.abs(info.offset.y) > 100 || Math.abs(info.velocity.y) > 500) {
      onClose();
    } else {
      dragY.set(0);
    }
  };

  const handleLike = () => {
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
  };

  const handleSubmitComment = () => {
    if (!newComment.trim() || !user) return;
    createComment.mutate(
      { postId: post.id, content: newComment.trim() },
      {
        onSuccess: () => {
          setNewComment("");
          refetchComments();
        },
      }
    );
  };

  const handleProfileClick = (username: string) => {
    onClose();
    navigate(`/${username}`);
  };

  const handleTapNavigation = (e: React.MouseEvent) => {
    if (!isCarousel) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    if (x < width / 3) {
      // Left third - previous
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    } else if (x > (width * 2) / 3) {
      // Right two thirds - next
      setCurrentIndex((prev) => Math.min(mediaUrls.length - 1, prev + 1));
    }
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

  const CommentsContent = () => (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum comentário ainda. Seja o primeiro!
            </p>
          ) : (
            comments.map((comment: any) => (
              <div key={comment.id} className="flex gap-3">
                <button onClick={() => handleProfileClick(comment.profile.username)}>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.profile.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{comment.profile.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                </button>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <button
                      onClick={() => handleProfileClick(comment.profile.username)}
                      className="font-semibold text-sm hover:underline"
                    >
                      {comment.profile.nickname || comment.profile.username}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {getTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Comment input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            ref={commentInputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicione um comentário..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmitComment();
              }
            }}
          />
          <Button
            size="sm"
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || createComment.isPending}
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            {/* Overlay */}
            <motion.div
              className="absolute inset-0 bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ opacity: overlayOpacity }}
              onClick={onClose}
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
              style={{
                opacity: dragOpacity,
                scale: dragScale,
                y: dragY,
              }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.7}
              onDragEnd={handleDragEnd}
            >
              {/* Media - fullscreen */}
              <div 
                className="absolute inset-0 bg-black flex items-center justify-center"
                onClick={handleTapNavigation}
              >
                {isVideo ? (
                  <video
                    ref={videoRef}
                    src={mediaUrls[0]}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    playsInline
                  />
                ) : (
                  <img
                    src={mediaUrls[currentIndex]}
                    alt={`Foto ${currentIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Progress bar for carousel */}
              {isCarousel && (
                <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2 pt-3">
                  {mediaUrls.map((_, index) => (
                    <div
                      key={index}
                      className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/30"
                    >
                      <div
                        className={`h-full bg-white transition-all duration-300 ${
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
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none" />

              {/* Header - overlaid */}
              <div className="absolute top-4 left-0 right-0 z-20 px-4 flex items-center justify-between">
                <button
                  onClick={() => handleProfileClick(post.profile.username)}
                  className="flex items-center gap-3"
                >
                  {/* Avatar with gradient border like replay */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-pink-500 p-[2px]" />
                    <Avatar className="w-10 h-10 relative border-2 border-black">
                      <AvatarImage src={post.profile.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{post.profile.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-sm text-white drop-shadow-lg">
                        {post.profile.nickname || post.profile.full_name || post.profile.username}
                      </span>
                      {post.profile.conta_verificada && (
                        <span className="material-symbols-outlined text-[14px] text-emerald-500">verified</span>
                      )}
                    </div>
                    <p className="text-xs text-white/80 drop-shadow-lg">{getTimeAgo(post.created_at)}</p>
                  </div>
                </button>

                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Bottom gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 pointer-events-none" />

              {/* Footer - overlaid */}
              <div className="absolute bottom-0 left-0 right-0 z-20 p-4 space-y-3">
                {/* Caption */}
                {post.content && (
                  <p className="text-sm text-white drop-shadow-lg line-clamp-2">
                    {post.content}
                  </p>
                )}

                {/* Location */}
                {post.location_name && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${post.location_lat},${post.location_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-white/80 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    <span className="truncate">{post.location_name}</span>
                  </a>
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
                      <ClappingHandsIcon
                        className={`w-7 h-7 ${isLikeAnimating ? "animate-applause-pop" : ""} ${
                          post.liked_by_user ? "text-amber-500" : "text-white"
                        }`}
                        filled={post.liked_by_user}
                      />
                      {post.likes_count > 0 && (
                        <span className="text-sm font-medium text-white">
                          {formatNumber(post.likes_count)}
                        </span>
                      )}
                    </button>

                    {/* Comment button */}
                    <button
                      onClick={() => setShowCommentsSheet(true)}
                      className="flex items-center gap-1.5 text-white hover:text-white/80 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[26px]">chat_bubble_outline</span>
                      {post.comments_count > 0 && (
                        <span className="text-sm font-medium">
                          {formatNumber(post.comments_count)}
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

      {/* Comments Sheet/Dialog */}
      {isMobile ? (
        <Drawer open={showCommentsSheet} onOpenChange={setShowCommentsSheet}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>Comentários</DrawerTitle>
            </DrawerHeader>
            <CommentsContent />
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showCommentsSheet} onOpenChange={setShowCommentsSheet}>
          <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Comentários</DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0">
              <CommentsContent />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
