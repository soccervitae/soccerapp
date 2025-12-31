import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileFeedSheet } from "@/components/profile/ProfileFeedSheet";
import { SharedStoryViewer } from "@/components/messages/SharedStoryViewer";
import { SharedHighlightViewer } from "@/components/messages/SharedHighlightViewer";
import {
  fetchSharedPost,
  fetchSharedStory,
  fetchSharedHighlight,
  type SharedPost,
  type SharedStory,
  type SharedHighlight,
} from "@/hooks/useSharedContentData";

interface SharedContentAuthor {
  username: string;
  avatar_url?: string | null;
}

interface SharedContentData {
  type: "shared_content";
  contentType: "post" | "story" | "highlight";
  contentId: string;
  url: string;
  preview?: string | null;
  title?: string | null;
  author?: SharedContentAuthor | null;
}

interface SharedContentPreviewProps {
  data: SharedContentData;
  isOwn: boolean;
}

export const SharedContentPreview = ({ data }: SharedContentPreviewProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Post viewer state
  const [postFeedOpen, setPostFeedOpen] = useState(false);
  const [loadedPost, setLoadedPost] = useState<SharedPost | null>(null);
  
  // Story viewer state
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [loadedStory, setLoadedStory] = useState<SharedStory | null>(null);
  
  // Highlight viewer state
  const [highlightViewerOpen, setHighlightViewerOpen] = useState(false);
  const [loadedHighlight, setLoadedHighlight] = useState<SharedHighlight | null>(null);

  const handleClick = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      switch (data.contentType) {
        case "post": {
          const post = await fetchSharedPost(data.contentId);
          if (post) {
            setLoadedPost(post);
            setPostFeedOpen(true);
          } else {
            toast.error("Publicação não encontrada");
          }
          break;
        }
        
        case "story": {
          const story = await fetchSharedStory(data.contentId);
          if (story) {
            setLoadedStory(story);
            setStoryViewerOpen(true);
          } else {
            toast.error("Replay não encontrado ou expirado");
          }
          break;
        }
        
        case "highlight": {
          const highlight = await fetchSharedHighlight(data.contentId);
          if (highlight) {
            setLoadedHighlight(highlight);
            setHighlightViewerOpen(true);
          } else {
            toast.error("Destaque não encontrado");
          }
          break;
        }
        
        default:
          toast.error("Tipo de conteúdo não suportado");
      }
    } catch (error) {
      console.error("Error loading shared content:", error);
      toast.error("Erro ao carregar conteúdo");
    } finally {
      setIsLoading(false);
    }
  };

  const author = data.author;
  const authorInitial = author?.username?.[0]?.toUpperCase() || "?";
  const isVideoContent = data.contentType === "story";

  // Truncate title to 2 lines worth
  const truncatedTitle = data.title
    ? data.title.length > 80
      ? data.title.substring(0, 80) + "..."
      : data.title
    : null;

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full max-w-[260px] rounded-lg overflow-hidden bg-muted/50 border border-border/50 transition-all hover:opacity-90 active:scale-[0.98] ${
          isLoading ? "opacity-70" : ""
        }`}
      >
        {/* Header with author */}
        {author && (
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30">
            <Avatar className="h-6 w-6">
              <AvatarImage src={author.avatar_url || undefined} />
              <AvatarFallback className="text-[10px]">{authorInitial}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-foreground truncate">
              {author.username}
            </span>
          </div>
        )}
        
        {/* Large thumbnail */}
        <div className="relative aspect-square w-full bg-muted">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : data.preview ? (
            <img
              src={data.preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Play className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          
          {/* Play overlay for video content */}
          {isVideoContent && data.preview && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              </div>
            </div>
          )}
        </div>

        {/* Caption */}
        {truncatedTitle && (
          <div className="px-3 py-2.5">
            <p className="text-xs text-foreground text-left line-clamp-2 leading-relaxed">
              {truncatedTitle}
            </p>
          </div>
        )}
      </button>

      {/* Post Feed Sheet */}
      {loadedPost && (
        <ProfileFeedSheet
          isOpen={postFeedOpen}
          onClose={() => {
            setPostFeedOpen(false);
            setLoadedPost(null);
          }}
          posts={[{
            id: loadedPost.id,
            content: loadedPost.content,
            media_url: loadedPost.media_url,
            media_type: loadedPost.media_type,
            created_at: loadedPost.created_at,
            user_id: loadedPost.user_id,
            likes_count: loadedPost.likes_count,
            comments_count: loadedPost.comments_count,
            location_name: loadedPost.location_name,
            location_lat: loadedPost.location_lat,
            location_lng: loadedPost.location_lng,
            music_track_id: loadedPost.music_track_id,
            music_start_seconds: loadedPost.music_start_seconds,
            music_end_seconds: loadedPost.music_end_seconds,
          }]}
          initialPostIndex={0}
          profile={{
            id: loadedPost.profile.id,
            username: loadedPost.profile.username,
            full_name: loadedPost.profile.full_name,
            avatar_url: loadedPost.profile.avatar_url,
            conta_verificada: loadedPost.profile.conta_verificada,
          }}
        />
      )}

      {/* Story Viewer */}
      {loadedStory && (
        <SharedStoryViewer
          story={loadedStory}
          isOpen={storyViewerOpen}
          onClose={() => {
            setStoryViewerOpen(false);
            setLoadedStory(null);
          }}
        />
      )}

      {/* Highlight Viewer */}
      {loadedHighlight && (
        <SharedHighlightViewer
          highlight={loadedHighlight}
          isOpen={highlightViewerOpen}
          onClose={() => {
            setHighlightViewerOpen(false);
            setLoadedHighlight(null);
          }}
        />
      )}
    </>
  );
};

// Helper to check if content is shared content
export const isSharedContentMessage = (mediaType: string | null): boolean => {
  return mediaType === "shared_content";
};

// Helper to parse shared content
export const parseSharedContent = (content: string): SharedContentData | null => {
  try {
    const parsed = JSON.parse(content);
    if (parsed.type === "shared_content") {
      return parsed as SharedContentData;
    }
    return null;
  } catch {
    return null;
  }
};
