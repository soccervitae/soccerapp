import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePostComments, useCreateComment, type Post } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CommentsSheetProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CommentsSheet = ({ post, open, onOpenChange }: CommentsSheetProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const { data: comments, isLoading } = usePostComments(post.id);
  const createComment = useCreateComment();

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

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="sm:max-w-lg h-[70vh] sm:h-[500px] flex flex-col">
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
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3 px-1">
                  <img
                    src={c.profile?.avatar_url || "/placeholder.svg"}
                    alt={c.profile?.username}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0 cursor-pointer"
                    onClick={() => {
                      onOpenChange(false);
                      navigate(`/${c.profile?.username}`);
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span 
                        className="font-semibold text-sm text-foreground cursor-pointer hover:underline"
                        onClick={() => {
                          onOpenChange(false);
                          navigate(`/${c.profile?.username}`);
                        }}
                      >
                        {c.profile?.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getTimeAgo(c.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-0.5 break-words">
                      {c.content}
                    </p>
                  </div>
                </div>
              ))}
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
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {user ? (
                <img 
                  src="/placeholder.svg" 
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
              className="flex-1 bg-muted rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
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
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
