import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLikePost, useSavePost, useCreateComment, useUpdatePost, useDeletePost, useReportPost, type Post } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface FeedPostProps {
  post: Post;
}

const REPORT_REASONS = [
  { value: "spam", label: "Spam ou conteúdo enganoso" },
  { value: "inappropriate", label: "Conteúdo impróprio" },
  { value: "harassment", label: "Assédio ou bullying" },
  { value: "violence", label: "Violência ou ameaças" },
  { value: "other", label: "Outro motivo" },
];

export const FeedPost = ({ post }: FeedPostProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");

  const likePost = useLikePost();
  const savePost = useSavePost();
  const createComment = useCreateComment();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const reportPost = useReportPost();

  const isOwner = user?.id === post.user_id;

  const handleProfileClick = () => {
    navigate(`/profile/${post.profile.id}`);
  };

  const handleLike = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    likePost.mutate({ postId: post.id, isLiked: post.liked_by_user });
  };

  const handleSave = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    savePost.mutate({ postId: post.id, isSaved: post.saved_by_user });
  };

  const handleComment = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!comment.trim()) return;
    
    createComment.mutate(
      { postId: post.id, content: comment },
      { onSuccess: () => setComment("") }
    );
  };

  const handleEdit = () => {
    setEditContent(post.content);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    updatePost.mutate(
      { postId: post.id, content: editContent },
      { onSuccess: () => setIsEditDialogOpen(false) }
    );
  };

  const handleDelete = () => {
    deletePost.mutate(post.id, {
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  const handleReport = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!reportReason) return;
    reportPost.mutate(
      { postId: post.id, reason: reportReason, description: reportDescription || undefined },
      {
        onSuccess: () => {
          setIsReportDialogOpen(false);
          setReportReason("");
          setReportDescription("");
        },
      }
    );
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
    return postDate.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  };

  return (
    <article className="border-b border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={handleProfileClick}
        >
          <div className="relative">
            <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-primary to-emerald-600">
              <img
                src={post.profile.avatar_url || "/placeholder.svg"}
                alt={post.profile.full_name || post.profile.username}
                className="w-full h-full rounded-full border-2 border-background object-cover"
              />
            </div>
            {post.profile.conta_verificada && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-background">
                <span className="material-symbols-outlined text-[12px] font-bold">verified</span>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm text-foreground hover:underline">
                {post.profile.nickname || post.profile.full_name || post.profile.username}
              </span>
            </div>
            {post.profile.position && (
              <p className="text-xs text-muted-foreground">{post.profile.position}</p>
            )}
          </div>
        </div>
        
        {isOwner && (
          <DropdownMenu>
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
              <DropdownMenuItem 
                onClick={() => setIsDeleteDialogOpen(true)} 
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <span className="material-symbols-outlined text-[18px] mr-2">delete</span>
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {!isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <span className="material-symbols-outlined text-[20px] text-foreground">more_horiz</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={() => setIsReportDialogOpen(true)} 
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <span className="material-symbols-outlined text-[18px] mr-2">flag</span>
                Denunciar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Media */}
      {post.media_url && (
        <div className="relative aspect-square bg-muted">
          {post.media_type === "video" ? (
            <video
              src={post.media_url}
              className="w-full h-full object-cover"
              controls
              playsInline
            />
          ) : (
            <img
              src={post.media_url}
              alt="Post"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}

      {/* Caption */}
      <div className="px-4 pt-3">
        <p className="text-sm text-foreground">
          {post.content}
        </p>
      </div>

      {/* Actions */}
      <div className="p-4">
        <div className="grid grid-cols-4 bg-card rounded-2xl border border-border shadow-sm mb-3">
          <button 
            onClick={handleLike}
            disabled={likePost.isPending}
            className={`flex flex-col items-center justify-center gap-1 p-3 transition-all active:scale-110 ${
              post.liked_by_user ? 'text-red-500' : 'text-foreground hover:text-muted-foreground'
            }`}
          >
            <span className={`material-symbols-outlined text-[24px] ${post.liked_by_user ? 'fill-1' : ''}`}>
              {post.liked_by_user ? 'favorite' : 'favorite_border'}
            </span>
            <span className="text-[10px] font-medium">Curtir</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex flex-col items-center justify-center gap-1 p-3 border-l border-border text-foreground hover:text-muted-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">chat_bubble_outline</span>
            <span className="text-[10px] font-medium">Comentar</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 p-3 border-l border-border text-foreground hover:text-muted-foreground transition-colors">
            <span className="material-symbols-outlined text-[24px]">send</span>
            <span className="text-[10px] font-medium">Enviar</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={savePost.isPending}
            className={`flex flex-col items-center justify-center gap-1 p-3 border-l border-border transition-colors ${
              post.saved_by_user ? 'text-primary' : 'text-foreground hover:text-muted-foreground'
            }`}
          >
            <span className={`material-symbols-outlined text-[24px] ${post.saved_by_user ? 'fill-1' : ''}`}>
              {post.saved_by_user ? 'bookmark' : 'bookmark_border'}
            </span>
            <span className="text-[10px] font-medium">Salvar</span>
          </button>
        </div>

        {/* Likes */}
        <p className="font-bold text-sm text-foreground mb-2">
          {formatNumber(post.likes_count || 0)} curtidas
        </p>

        {/* Comments count */}
        {(post.comments_count || 0) > 0 && (
          <button 
            onClick={() => setShowComments(!showComments)}
            className="text-sm text-muted-foreground mb-1"
          >
            Ver todos os {post.comments_count} comentários
          </button>
        )}

        {/* Time */}
        <p className="text-xs text-muted-foreground uppercase mt-2">{getTimeAgo()}</p>

        {/* Comment input */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-border animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {user ? (
                  <img 
                    src={"/placeholder.svg"} 
                    alt="You" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-[16px] text-muted-foreground">person</span>
                )}
              </div>
              <input
                type="text"
                placeholder="Adicione um comentário..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleComment()}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              {comment && (
                <button 
                  onClick={handleComment}
                  disabled={createComment.isPending}
                  className="text-primary font-bold text-sm hover:text-primary/80 transition-colors disabled:opacity-50"
                >
                  Publicar
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar publicação</DialogTitle>
          </DialogHeader>
          <div className="py-4">
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
            <Button 
              onClick={handleSaveEdit} 
              disabled={updatePost.isPending || !editContent.trim()}
            >
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
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletePost.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
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
                {REPORT_REASONS.map((reason) => (
                  <div key={reason.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason.value} id={reason.value} />
                    <Label htmlFor={reason.value} className="font-normal cursor-pointer">
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Detalhes adicionais (opcional)</Label>
              <Textarea
                id="description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Forneça mais informações sobre a denúncia..."
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleReport} 
              disabled={reportPost.isPending || !reportReason}
              variant="destructive"
            >
              {reportPost.isPending ? "Enviando..." : "Denunciar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
};
