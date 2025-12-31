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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

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
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [newComment, setNewComment] = useState("");
  const [showLikesSheet, setShowLikesSheet] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

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
    if (!carouselApi) return;
    const onSelect = () => setCurrentIndex(carouselApi.selectedScrollSnap());
    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  useEffect(() => {
    if (carouselApi && isOpen) {
      carouselApi.scrollTo(initialIndex, true);
    }
  }, [carouselApi, initialIndex, isOpen]);

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

  const getInitialPosition = () => {
    if (!originRect) {
      return { opacity: 0, scale: 0.8, borderRadius: "16px" };
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex">
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ opacity: overlayOpacity }}
            onClick={onClose}
          />

          {/* Content - Desktop side-by-side, Mobile stacked */}
          <motion.div
            className="relative w-full h-full flex flex-col lg:flex-row"
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
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* Media Section */}
            <div className="flex-1 lg:flex-[2] flex items-center justify-center bg-black relative min-h-[40vh] lg:min-h-full">
              {isVideo ? (
                <video
                  src={mediaUrls[0]}
                  className="w-full h-full object-contain max-h-[60vh] lg:max-h-full"
                  controls
                  autoPlay
                  playsInline
                />
              ) : isCarousel ? (
                <div className="relative w-full h-full">
                  <Carousel
                    setApi={setCarouselApi}
                    className="w-full h-full"
                    opts={{ startIndex: initialIndex }}
                  >
                    <CarouselContent className="h-full">
                      {mediaUrls.map((url, index) => (
                        <CarouselItem key={index} className="h-full flex items-center justify-center">
                          <img
                            src={url}
                            alt={`Foto ${index + 1}`}
                            className="max-w-full max-h-[60vh] lg:max-h-full object-contain"
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>

                  {/* Counter */}
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full">
                    <span className="text-sm font-medium text-white">
                      {currentIndex + 1}/{mediaUrls.length}
                    </span>
                  </div>

                  {/* Indicators */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    {mediaUrls.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => carouselApi?.scrollTo(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentIndex ? "bg-white w-6" : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <img
                  src={mediaUrls[0]}
                  alt="Post"
                  className="max-w-full max-h-[60vh] lg:max-h-full object-contain"
                />
              )}
            </div>

            {/* Interactions Section */}
            <div className="flex-1 lg:flex-[1] bg-black flex flex-col max-h-[60vh] lg:max-h-full">
              {/* Header with author info */}
              <div className="flex items-center gap-3 p-4 border-b border-white/20">
                <button
                  onClick={() => handleProfileClick(post.profile.username)}
                  className="flex items-center gap-3 flex-1"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={post.profile.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{post.profile.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-sm text-white">
                        {post.profile.nickname || post.profile.full_name || post.profile.username}
                      </span>
                      {post.profile.conta_verificada && (
                        <span className="material-symbols-outlined text-[14px] text-emerald-500">verified</span>
                      )}
                    </div>
                    {post.profile.position && (
                      <p className="text-xs text-white/60">{post.profile.position}</p>
                    )}
                  </div>
                </button>
                <span className="text-xs text-white/60">{getTimeAgo(post.created_at)}</span>
              </div>

              {/* Caption and location */}
              <div className="p-4 border-b border-white/20 space-y-2">
                <p className="text-sm text-white">{post.content}</p>
                {post.location_name && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${post.location_lat},${post.location_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-white/60 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    <span className="truncate">{post.location_name}</span>
                  </a>
                )}
              </div>

              {/* Comments List */}
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-4 space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-sm text-white/60 text-center py-8">
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
                              className="font-semibold text-sm text-white hover:underline"
                            >
                              {comment.profile.nickname || comment.profile.username}
                            </button>
                            <span className="text-xs text-white/60">
                              {getTimeAgo(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-white">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Actions bar */}
              <div className="border-t border-white/20 p-4 space-y-3">
                {/* Like count and actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleLike}
                      disabled={likePost.isPending}
                      className={`flex items-center gap-1.5 transition-all active:scale-110 ${
                        post.liked_by_user ? "text-amber-500" : "text-white hover:text-white/60"
                      }`}
                    >
                      <ClappingHandsIcon
                        className={`w-6 h-6 ${isLikeAnimating ? "animate-applause-pop" : ""}`}
                        filled={post.liked_by_user}
                      />
                    </button>
                    <button
                      onClick={() => commentInputRef.current?.focus()}
                      className="text-white hover:text-white/60 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[24px]">chat_bubble_outline</span>
                    </button>
                  </div>
                </div>

                {/* Like count text */}
                {post.likes_count > 0 && (
                  <button
                    onClick={() => setShowLikesSheet(!showLikesSheet)}
                    className="text-sm font-semibold text-white hover:underline text-left"
                  >
                    {formatNumber(post.likes_count)} {post.likes_count === 1 ? "aplauso" : "aplausos"}
                  </button>
                )}

                {/* Likes list (expanded) */}
                {showLikesSheet && likes.length > 0 && (
                  <div className="bg-white/10 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <div className="space-y-2">
                      {likes.slice(0, 10).map((like: any) => (
                        <button
                          key={like.user_id}
                          onClick={() => handleProfileClick(like.username)}
                          className="flex items-center gap-2 w-full hover:bg-white/10 rounded-lg p-1 transition-colors"
                        >
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={like.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>{like.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-white truncate">
                            {like.nickname || like.full_name || like.username}
                          </span>
                        </button>
                      ))}
                      {likes.length > 10 && (
                        <p className="text-xs text-white/60 text-center">
                          e mais {likes.length - 10} pessoas
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Comment input */}
                <div className="flex gap-2">
                  <Input
                    ref={commentInputRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Adicione um comentário..."
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
