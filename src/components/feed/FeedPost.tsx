import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLikePost, useSavePost, useUpdatePost, useDeletePost, useReportPost, type Post } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import { CommentsSheet } from "./CommentsSheet";
import { LikesSheet } from "./LikesSheet";
import { usePostTags } from "@/hooks/usePostTags";
import { PostMusicPlayer } from "./PostMusicPlayer";
import { PostMediaViewer } from "./PostMediaViewer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
interface FeedPostProps {
  post: Post;
}
const REPORT_REASONS = [{
  value: "spam",
  label: "Spam ou conteúdo enganoso"
}, {
  value: "inappropriate",
  label: "Conteúdo impróprio"
}, {
  value: "harassment",
  label: "Assédio ou bullying"
}, {
  value: "violence",
  label: "Violência ou ameaças"
}, {
  value: "other",
  label: "Outro motivo"
}];
export const FeedPost = ({
  post
}: FeedPostProps) => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [isCommentsSheetOpen, setIsCommentsSheetOpen] = useState(false);
  const [isLikesSheetOpen, setIsLikesSheetOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTags, setShowTags] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [clickOrigin, setClickOrigin] = useState<DOMRect | null>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const lastTapRef = useRef<number>(0);
  const {
    data: postTags = []
  } = usePostTags(post.id);
  const likePost = useLikePost();
  const savePost = useSavePost();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const reportPost = useReportPost();
  const isOwner = user?.id === post.user_id;

  // Carousel effect
  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setCurrentIndex(carouselApi.selectedScrollSnap());
    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  // Helper to parse media URLs
  const getMediaUrls = (): string[] => {
    if (!post.media_url) return [];
    try {
      const parsed = JSON.parse(post.media_url);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Not JSON, single URL
    }
    return [post.media_url];
  };
  const mediaUrls = getMediaUrls();
  const isCarousel = post.media_type === "carousel" || mediaUrls.length > 1;
  const handleProfileClick = () => {
    navigate(`/${post.profile.username}`);
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
      isLiked: post.liked_by_user
    });
  };
  const handleDoubleTap = (event: React.MouseEvent, index: number = 0) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected
      if (!post.liked_by_user) {
        handleLike();
      }
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
    } else {
      // Single tap - open media viewer
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      setClickOrigin(rect);
      setSelectedMediaIndex(index);
      setMediaViewerOpen(true);
    }
    lastTapRef.current = now;
  };
  const handleSave = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    savePost.mutate({
      postId: post.id,
      isSaved: post.saved_by_user
    });
  };
  const handleEdit = () => {
    setEditContent(post.content);
    setIsEditDialogOpen(true);
  };
  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    updatePost.mutate({
      postId: post.id,
      content: editContent
    }, {
      onSuccess: () => setIsEditDialogOpen(false)
    });
  };
  const handleDelete = () => {
    deletePost.mutate(post.id, {
      onSuccess: () => setIsDeleteDialogOpen(false)
    });
  };
  const handleReport = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!reportReason) return;
    reportPost.mutate({
      postId: post.id,
      reason: reportReason,
      description: reportDescription || undefined
    }, {
      onSuccess: () => {
        setIsReportDialogOpen(false);
        setReportReason("");
        setReportDescription("");
      }
    });
  };
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(".0", "") + "k";
    }
    return num.toString();
  };
  const getTimeAgo = () => {
    const now = new Date();
    const postDate = new Date(post.created_at);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
    if (diffInSeconds < 60) return "agora";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} d`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} sem`;
    return postDate.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short"
    });
  };
  return <article className="border-b border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleProfileClick}>
          <div className="relative">
            <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-primary to-emerald-600">
              <img src={post.profile.avatar_url || "/placeholder.svg"} alt={post.profile.full_name || post.profile.username} className="w-full h-full rounded-full border-2 border-background object-cover" />
            </div>
            {post.profile.conta_verificada && <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-background">
                <span className="material-symbols-outlined text-[12px] font-bold">verified</span>
              </div>}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm text-foreground hover:underline">
                {post.profile.nickname || post.profile.full_name || post.profile.username}
              </span>
            </div>
            {post.profile.position && <p className="text-xs text-muted-foreground">{post.profile.position}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground uppercase">
            {getTimeAgo()}
            {post.updated_at && new Date(post.updated_at).getTime() > new Date(post.created_at).getTime() + 60000 && <span className="ml-1 normal-case">(editado)</span>}
          </span>
          
          {isOwner && <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <span className="material-symbols-outlined text-[20px] text-foreground">more_horiz</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                <span className="material-symbols-outlined text-[18px] mr-2">edit</span>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="cursor-pointer text-destructive focus:text-destructive">
                <span className="material-symbols-outlined text-[18px] mr-2">delete</span>
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>}

        {!isOwner && <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <span className="material-symbols-outlined text-[20px] text-foreground">more_horiz</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)} className="cursor-pointer text-destructive focus:text-destructive">
                <span className="material-symbols-outlined text-[18px] mr-2">flag</span>
                Denunciar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>}
        </div>
      </div>

      {/* Media */}
      {post.media_url && <div className="relative aspect-square bg-muted">
          {post.media_type === "video" ? <div className="w-full h-full cursor-pointer" onClick={e => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setClickOrigin(rect);
        setSelectedMediaIndex(0);
        setMediaViewerOpen(true);
      }}>
              <video src={post.media_url} className="w-full h-full object-cover pointer-events-none" playsInline muted />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-3xl">play_arrow</span>
                </div>
              </div>
            </div> : isCarousel ? <>
              <Carousel setApi={setCarouselApi} className="w-full h-full">
                <CarouselContent className="h-full">
                  {mediaUrls.map((url, index) => <CarouselItem key={index} className="h-full relative">
                      <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover cursor-pointer" onClick={e => handleDoubleTap(e, index)} />
                      {/* Tags overlay for this image */}
                      {showTags && postTags.filter(tag => tag.photo_index === index).map(tag => <button key={tag.id} onClick={() => navigate(`/${tag.profile.username}`)} className="absolute bg-foreground/90 text-background px-2 py-1 rounded text-xs font-medium transform -translate-x-1/2 -translate-y-1/2 hover:bg-foreground transition-colors z-10" style={{
                left: `${tag.x_position}%`,
                top: `${tag.y_position}%`
              }}>
                            @{tag.profile.username}
                          </button>)}
                    </CarouselItem>)}
                </CarouselContent>
              </Carousel>
              {/* Carousel Counter */}
              <div className="absolute top-3 right-3 px-2.5 py-1 bg-background/80 backdrop-blur-sm rounded-full">
                <span className="text-xs font-medium text-foreground">
                  {currentIndex + 1}/{mediaUrls.length}
                </span>
              </div>
              {/* Carousel Indicators */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {mediaUrls.map((_, index) => <button key={index} onClick={() => carouselApi?.scrollTo(index)} className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? "bg-primary w-4" : "bg-background/60"}`} />)}
              </div>
            </> : <>
              <img src={mediaUrls[0]} alt="Post" className="w-full h-full object-cover cursor-pointer" onClick={e => handleDoubleTap(e, 0)} />
              {/* Tags overlay for single image */}
              {showTags && postTags.filter(tag => tag.photo_index === 0).map(tag => <button key={tag.id} onClick={() => navigate(`/${tag.profile.username}`)} className="absolute bg-foreground/90 text-background px-2 py-1 rounded text-xs font-medium transform -translate-x-1/2 -translate-y-1/2 hover:bg-foreground transition-colors z-10" style={{
          left: `${tag.x_position}%`,
          top: `${tag.y_position}%`
        }}>
                    @{tag.profile.username}
                  </button>)}
            </>}

          {/* Heart animation overlay */}
          {showHeartAnimation && <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <span className="material-symbols-outlined fill-1 text-white text-[100px] animate-heart-burst drop-shadow-lg">
                favorite
              </span>
            </div>}

          {/* Tags toggle button */}
          {postTags.length > 0 && post.media_type !== "video" && <button onClick={() => setShowTags(!showTags)} className={`absolute bottom-3 left-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showTags ? "bg-foreground text-background" : "bg-background/80 backdrop-blur-sm text-foreground"}`}>
              <span className="material-symbols-outlined text-[18px]">person</span>
            </button>}
        </div>}

      {/* Location */}
      {post.location_name && <a href={`https://www.google.com/maps/search/?api=1&query=${post.location_lat},${post.location_lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 pt-2 text-xs text-muted-foreground hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[16px]">location_on</span>
          <span className="truncate">{post.location_name}</span>
        </a>}

      {/* Music Player */}
      {post.music_track && <PostMusicPlayer track={post.music_track} startSeconds={post.music_start_seconds ?? 0} endSeconds={post.music_end_seconds ?? post.music_track.duration_seconds} />}

      {/* Caption */}
      <div className="px-4 pt-3">
        <p className="text-sm text-foreground">
          {post.content}
        </p>
      </div>

      {/* Liked by section */}
      {post.likes_count > 0 && post.recent_likes && post.recent_likes.length > 0 && <div className="px-4 pt-2 pb-1">
          <button onClick={() => setIsLikesSheetOpen(true)} className="flex items-center gap-2 group">
            {/* Stacked avatars */}
            <div className="flex -space-x-2">
              {post.recent_likes.slice(0, 3).map((like, index) => <img key={like.user_id} src={like.avatar_url || "/placeholder.svg"} alt={like.username} className="w-6 h-6 rounded-full border-2 border-background object-cover" style={{
            zIndex: 3 - index
          }} />)}
            </div>
            
            {/* Text */}
            <p className="text-sm text-foreground">
              Curtido por{" "}
              <span className="font-semibold group-hover:underline" onClick={e => {
            e.stopPropagation();
            navigate(`/${post.recent_likes[0].username}`);
          }}>
                {post.recent_likes[0].nickname || post.recent_likes[0].username}
              </span>
              {post.likes_count > 1 && <>
                  {" "}e{" "}
                  <span className="font-semibold group-hover:underline">
                    {post.likes_count === 2 ? post.recent_likes[1]?.nickname || post.recent_likes[1]?.username || "outra pessoa" : `outras ${post.likes_count - 1} pessoas`}
                  </span>
                </>}
            </p>
          </button>
        </div>}

      {/* Actions */}
      <div className="px-4 pt-3 py-[4px]">
        <div className="grid grid-cols-4">
          <button onClick={handleLike} disabled={likePost.isPending} className={`flex items-center justify-center p-3 gap-1.5 transition-all active:scale-110 ${post.liked_by_user ? 'text-red-500' : 'text-foreground hover:text-muted-foreground'}`}>
            <span className={`material-symbols-outlined text-[24px] ${post.liked_by_user ? 'fill-1' : ''} ${isLikeAnimating ? 'animate-heart-pop' : ''}`}>
              {post.liked_by_user ? 'favorite' : 'favorite_border'}
            </span>
            {(post.likes_count || 0) >= 1 && <span className="text-xs font-medium">{formatNumber(post.likes_count)}</span>}
          </button>
          <button onClick={() => setIsCommentsSheetOpen(true)} className="flex items-center justify-center p-3 gap-1.5 border-l border-border text-foreground hover:text-muted-foreground transition-colors">
            <span className="material-symbols-outlined text-[24px]">chat_bubble_outline</span>
            {(post.comments_count || 0) >= 1 && <span className="text-xs font-medium">{formatNumber(post.comments_count)}</span>}
          </button>
          <button className="flex items-center justify-center p-3 border-l border-border text-foreground hover:text-muted-foreground transition-colors">
            <span className="material-symbols-outlined text-[24px]">send</span>
          </button>
          <button onClick={handleSave} disabled={savePost.isPending} className={`flex items-center justify-center p-3 border-l border-border transition-colors ${post.saved_by_user ? 'text-primary' : 'text-foreground hover:text-muted-foreground'}`}>
            <span className={`material-symbols-outlined text-[24px] ${post.saved_by_user ? 'fill-1' : ''}`}>
              {post.saved_by_user ? 'bookmark' : 'bookmark_border'}
            </span>
          </button>
        </div>
      </div>

      

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar publicação</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="O que você está pensando?" className="min-h-[100px] resize-none" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={updatePost.isPending || !editContent.trim()}>
              {updatePost.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir publicação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A publicação será permanentemente excluída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deletePost.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletePost.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Denunciar publicação</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-3">
              <Label>Por que você está denunciando esta publicação?</Label>
              <RadioGroup value={reportReason} onValueChange={setReportReason}>
                {REPORT_REASONS.map(reason => <div key={reason.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason.value} id={reason.value} />
                    <Label htmlFor={reason.value} className="font-normal cursor-pointer">
                      {reason.label}
                    </Label>
                  </div>)}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Detalhes adicionais (opcional)</Label>
              <Textarea id="description" value={reportDescription} onChange={e => setReportDescription(e.target.value)} placeholder="Forneça mais informações sobre a denúncia..." className="min-h-[80px] resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReport} disabled={reportPost.isPending || !reportReason} variant="destructive">
              {reportPost.isPending ? "Enviando..." : "Denunciar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comments Sheet */}
      <CommentsSheet post={post} open={isCommentsSheetOpen} onOpenChange={setIsCommentsSheetOpen} />

      {/* Likes Sheet */}
      <LikesSheet postId={post.id} open={isLikesSheetOpen} onOpenChange={setIsLikesSheetOpen} />

      {/* Media Viewer */}
      <PostMediaViewer mediaUrls={mediaUrls} mediaType={post.media_type} initialIndex={selectedMediaIndex} isOpen={mediaViewerOpen} onClose={() => setMediaViewerOpen(false)} originRect={clickOrigin} />
    </article>;
};