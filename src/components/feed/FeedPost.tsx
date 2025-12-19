import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Athlete {
  name: string;
  username: string;
  avatar: string;
  position: string;
  team: string;
  verified: boolean;
}

interface Post {
  id: number;
  athlete: Athlete;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  timeAgo: string;
  liked: boolean;
}

interface FeedPostProps {
  post: Post;
}

export const FeedPost = ({ post }: FeedPostProps) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.liked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");

  const handleProfileClick = () => {
    navigate("/profile", { 
      state: { 
        athlete: post.athlete 
      } 
    });
  };

  const handleLike = () => {
    if (liked) {
      setLikesCount(likesCount - 1);
    } else {
      setLikesCount(likesCount + 1);
    }
    setLiked(!liked);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(".0", "") + "k";
    }
    return num.toString();
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
                src={post.athlete.avatar}
                alt={post.athlete.name}
                className="w-full h-full rounded-full border-2 border-background object-cover"
              />
            </div>
            {post.athlete.verified && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground rounded-full p-0.5 border-2 border-background">
                <span className="material-symbols-outlined text-[10px] font-bold">verified</span>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm text-foreground hover:underline">{post.athlete.username}</span>
            </div>
            <p className="text-xs text-muted-foreground">{post.athlete.position} • {post.athlete.team}</p>
          </div>
        </div>
        <button className="p-2 hover:bg-muted rounded-full transition-colors">
          <span className="material-symbols-outlined text-[20px] text-foreground">more_horiz</span>
        </button>
      </div>

      {/* Image */}
      <div className="relative aspect-square bg-muted">
        <img
          src={post.image}
          alt="Post"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-center gap-6 mb-3">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-1 transition-all active:scale-125 ${liked ? 'text-red-500' : 'text-foreground hover:text-muted-foreground'}`}
          >
            <span className={`material-symbols-outlined text-[26px] ${liked ? 'fill-1' : ''}`}>
              {liked ? 'favorite' : 'favorite_border'}
            </span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 text-foreground hover:text-muted-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-[26px]">chat_bubble_outline</span>
          </button>
          <button className="flex items-center gap-1 text-foreground hover:text-muted-foreground transition-colors">
            <span className="material-symbols-outlined text-[26px]">send</span>
          </button>
          <button className="text-foreground hover:text-muted-foreground transition-colors">
            <span className="material-symbols-outlined text-[26px]">bookmark_border</span>
          </button>
        </div>

        {/* Likes */}
        <p className="font-bold text-sm text-foreground mb-2">
          {formatNumber(likesCount)} curtidas
        </p>

        {/* Caption */}
        <p className="text-sm text-foreground mb-1">
          <span className="font-bold">{post.athlete.username}</span>{" "}
          {post.caption}
        </p>

        {/* Comments count */}
        <button 
          onClick={() => setShowComments(!showComments)}
          className="text-sm text-muted-foreground mb-1"
        >
          Ver todos os {post.comments} comentários
        </button>

        {/* Time */}
        <p className="text-xs text-muted-foreground uppercase">{post.timeAgo}</p>

        {/* Comment input */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-border animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px] text-muted-foreground">person</span>
              </div>
              <input
                type="text"
                placeholder="Adicione um comentário..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              {comment && (
                <button className="text-primary font-bold text-sm hover:text-primary/80 transition-colors">
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
