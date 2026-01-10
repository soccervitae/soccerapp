import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { usePostComments, useCreateComment, useUpdateComment, useDeleteComment, type Post, type Comment } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useCommentLikes, useLikeComment } from "@/hooks/useCommentLikes";
import { ClappingHandsIcon } from "@/components/icons/ClappingHandsIcon";
import { CommentLikesSheet } from "./CommentLikesSheet";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface CommentsSheetProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CommentsSheet = ({ post, open, onOpenChange }: CommentsSheetProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: currentUserProfile } = useProfile(user?.id);
  const [comment, setComment] = useState("");
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [editingComment, setEditingComment] = useState<{ id: string; content: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const { data: comments, isLoading } = usePostComments(post.id);
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const likeComment = useLikeComment();

  // Get all comment IDs including replies for fetching likes
  const allCommentIds = useMemo(() => {
    const ids: string[] = [];
    const collectIds = (commentList: Comment[] | undefined) => {
      for (const c of commentList || []) {
        ids.push(c.id);
        if (c.replies) collectIds(c.replies);
      }
    };
    collectIds(comments);
    return ids;
  }, [comments]);
  
  const { data: likesData } = useCommentLikes(allCommentIds);

  // Focus edit input when editing
  useEffect(() => {
    if (editingComment && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingComment]);

  const handleComment = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!comment.trim()) return;
    
    createComment.mutate(
      { 
        postId: post.id, 
        content: comment,
        parentId: replyingTo?.id,
      },
      { 
        onSuccess: () => {
          setComment("");
          setReplyingTo(null);
          // Auto-expand replies for the parent comment
          if (replyingTo) {
            setExpandedReplies(prev => new Set(prev).add(replyingTo.id));
          }
        } 
      }
    );
  };

  const handleEditComment = () => {
    if (!editingComment || !editingComment.content.trim()) return;
    
    updateComment.mutate(
      { 
        commentId: editingComment.id, 
        content: editingComment.content,
        postId: post.id,
      },
      { 
        onSuccess: () => {
          setEditingComment(null);
        } 
      }
    );
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment.mutate(
      { commentId, postId: post.id },
      {
        onSuccess: () => {
          setDeleteConfirm(null);
        }
      }
    );
  };

  const handleReply = (commentId: string, username: string) => {
    setReplyingTo({ id: commentId, username });
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setComment("");
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleLikeComment = (commentId: string) => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    const isLiked = likesData?.likedByUser[commentId] || false;
    likeComment.mutate({ commentId, isLiked });
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "agora";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} d`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} sem`;
    return commentDate.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  };

  // Render a single comment (used for both parent and replies)
  const renderComment = (c: Comment, isReply: boolean = false) => {
    const isLiked = likesData?.likedByUser[c.id] || false;
    const likesCount = likesData?.counts[c.id] || 0;
    const repliesCount = c.replies?.length || 0;
    const isExpanded = expandedReplies.has(c.id);
    const isOwnComment = user?.id === c.user_id;
    const isEditing = editingComment?.id === c.id;
    
    return (
      <div key={c.id} className={`${isReply ? 'ml-12' : ''}`}>
        <div className="flex gap-3 px-1">
          <img
            src={c.profile?.avatar_url || "/placeholder.svg"}
            alt={c.profile?.username}
            className={`${isReply ? 'w-7 h-7' : 'w-9 h-9'} rounded-full object-cover flex-shrink-0 cursor-pointer`}
            onClick={() => {
              onOpenChange(false);
              navigate(`/${c.profile?.username}`);
            }}
          />
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="bg-muted/50 rounded-2xl px-3 py-2">
                <span className="font-semibold text-sm text-foreground">
                  {c.profile?.username}
                </span>
                <input
                  ref={editInputRef}
                  type="text"
                  value={editingComment.content}
                  onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                  onKeyPress={(e) => e.key === "Enter" && handleEditComment()}
                  className="w-full bg-transparent text-sm text-foreground outline-none mt-1"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setEditingComment(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEditComment}
                    disabled={updateComment.isPending || !editingComment.content.trim()}
                    className="text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-50"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-muted/50 rounded-2xl px-3 py-2">
                <span 
                  className="font-semibold text-sm text-foreground cursor-pointer hover:underline"
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/${c.profile?.username}`);
                  }}
                >
                  {c.profile?.username}
                </span>
                <p className="text-sm text-foreground break-words">
                  {c.content}
                </p>
              </div>
            )}
            {/* Actions row */}
            {!isEditing && (
              <div className="flex items-center gap-4 mt-1 ml-2">
                <span className="text-xs text-muted-foreground">
                  {getTimeAgo(c.created_at)}
                </span>
                {/* Like count */}
                {likesCount > 0 && (
                  <button
                    onClick={() => setSelectedCommentId(c.id)}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    {likesCount}
                  </button>
                )}
                {/* Reply button - only for parent comments */}
                {!isReply && (
                  <button
                    onClick={() => handleReply(c.id, c.profile?.username || "")}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Responder
                  </button>
                )}
              </div>
            )}
            {/* Show replies toggle */}
            {!isReply && repliesCount > 0 && !isEditing && (
              <button
                onClick={() => toggleReplies(c.id)}
                className="flex items-center gap-2 mt-2 ml-2 text-xs font-semibold text-primary hover:underline"
              >
                <div className="w-6 h-px bg-muted-foreground/50" />
                {isExpanded ? 'Ocultar respostas' : `Ver ${repliesCount} ${repliesCount === 1 ? 'resposta' : 'respostas'}`}
              </button>
            )}
          </div>
          {/* Like button with count and options menu */}
          <div className="flex items-center gap-1 flex-shrink-0 self-start mt-2">
            <button
              onClick={() => handleLikeComment(c.id)}
              disabled={likeComment.isPending}
              className="p-1 transition-all active:scale-110"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isLiked ? "liked" : "unliked"}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <ClappingHandsIcon 
                    className="w-4 h-4" 
                    filled={isLiked} 
                    variant="green" 
                  />
                </motion.div>
              </AnimatePresence>
            </button>
            {likesCount > 0 && (
              <span className="text-xs text-muted-foreground">{likesCount}</span>
            )}
            {/* Options menu for own comments */}
            {isOwnComment && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[80]">
                  <DropdownMenuItem
                    onClick={() => setEditingComment({ id: c.id, content: c.content })}
                    className="gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteConfirm(c.id)}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        {/* Render replies if expanded */}
        {!isReply && isExpanded && c.replies && c.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {c.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="sm:max-w-lg h-[70vh] sm:h-[500px] flex flex-col z-[70]" overlayClassName="z-[70]">
        <ResponsiveModalHeader className="border-b border-border pb-4">
          <ResponsiveModalTitle className="text-center">Comentários</ResponsiveModalTitle>
        </ResponsiveModalHeader>
        
        <ScrollArea className="flex-1 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : comments && comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((c) => renderComment(c))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <span className="material-symbols-outlined text-4xl mb-2">chat_bubble_outline</span>
              <p className="text-sm">Nenhum comentário ainda</p>
              <p className="text-xs mt-1">Seja o primeiro a comentar!</p>
            </div>
          )}
        </ScrollArea>

        {/* Comment input */}
        <div className="border-t border-border bg-background p-4 mt-auto">
          {/* Reply indicator */}
          {replyingTo && (
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs text-muted-foreground">
                Respondendo a <span className="font-semibold text-foreground">@{replyingTo.username}</span>
              </span>
              <button
                onClick={cancelReply}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {user && currentUserProfile?.avatar_url ? (
                <img 
                  src={currentUserProfile.avatar_url} 
                  alt={currentUserProfile.username || "You"} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-[16px] text-muted-foreground">person</span>
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder={replyingTo ? `Responder a @${replyingTo.username}...` : "Adicione um comentário..."}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleComment()}
              className="flex-1 bg-muted rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            {comment && (
              <button 
                onClick={handleComment}
                disabled={createComment.isPending}
                className="text-primary font-bold text-sm hover:text-primary/80 transition-colors disabled:opacity-50"
              >
                {replyingTo ? 'Responder' : 'Publicar'}
              </button>
            )}
          </div>
        </div>
      </ResponsiveModalContent>

      {/* Comment Likes Sheet */}
      <CommentLikesSheet
        commentId={selectedCommentId || ""}
        open={!!selectedCommentId}
        onOpenChange={(open) => {
          if (!open) setSelectedCommentId(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="z-[90]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comentário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteComment(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ResponsiveModal>
  );
};
