import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLikePost, useSavePost, useCreateComment, type Post } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FeedPostProps {
  post: Post;
}

export const FeedPost = ({ post }: FeedPostProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");

  const likePost = useLikePost();
  const savePost = useSavePost();
  const createComment = useCreateComment();

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

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(".0", "") + "k";
    }
    return num.toString();
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: false,
    locale: ptBR,
  });

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
              <span className="font-bold text-sm text-foreground hover:underline">{post.profile.username}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {post.profile.position && post.profile.team 
                ? `${post.profile.position} • ${post.profile.team}` 
                : post.profile.full_name}
            </p>
          </div>
        </div>
        <button className="p-2 hover:bg-muted rounded-full transition-colors">
          <span className="material-symbols-outlined text-[20px] text-foreground">more_horiz</span>
        </button>
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
          <span className="font-bold">{post.profile.username}</span>{" "}
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
        <p className="text-xs text-muted-foreground uppercase mt-2">{timeAgo}</p>

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
    </article>
  );
};
