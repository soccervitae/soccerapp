import { useState } from "react";
import { Image, Play, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
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

interface SharedContentData {
  type: "shared_content";
  contentType: "post" | "story" | "highlight";
  contentId: string;
  url: string;
  preview?: string | null;
  title?: string | null;
}

interface SharedContentPreviewProps {
  data: SharedContentData;
  isOwn: boolean;
}

export const SharedContentPreview = ({ data, isOwn }: SharedContentPreviewProps) => {
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

  const getContentLabel = () => {
    switch (data.contentType) {
      case "post":
        return "Publicação";
      case "story":
        return "Replay";
      case "highlight":
        return "Destaque";
      default:
        return "Conteúdo";
    }
  };

  const getContentIcon = () => {
    switch (data.contentType) {
      case "post":
        return Image;
      case "story":
        return Play;
      case "highlight":
        return Star;
      default:
        return Image;
    }
  };

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

  const ContentIcon = getContentIcon();
  const truncatedTitle = data.title
    ? data.title.length > 60
      ? data.title.substring(0, 60) + "..."
      : data.title
    : null;

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full rounded-xl overflow-hidden border transition-all hover:opacity-90 active:scale-[0.98] ${
          isOwn
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            : "bg-background/80 border-border"
        } ${isLoading ? "opacity-70" : ""}`}
      >
        <div className="flex gap-3 p-2">
          {/* Thumbnail */}
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className={`w-6 h-6 animate-spin ${isOwn ? "text-green-600" : "text-muted-foreground"}`} />
              </div>
            ) : data.preview ? (
              <img
                src={data.preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ContentIcon className={`w-6 h-6 ${isOwn ? "text-green-600" : "text-muted-foreground"}`} />
              </div>
            )}
            {/* Play overlay for stories */}
            {data.contentType === "story" && data.preview && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
            )}
          </div>

          {/* Content info */}
          <div className="flex-1 flex flex-col justify-center text-left min-w-0">
            {/* Label */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <ContentIcon className={`w-3.5 h-3.5 ${isOwn ? "text-green-600" : "text-primary"}`} />
              <span className={`text-xs font-medium uppercase tracking-wide ${
                isOwn ? "text-green-600" : "text-primary"
              }`}>
                {getContentLabel()}
              </span>
            </div>

            {/* Title/description */}
            {truncatedTitle && (
              <p className={`text-sm leading-tight line-clamp-2 ${
                isOwn ? "text-green-800 dark:text-green-100" : "text-foreground"
              }`}>
                {truncatedTitle}
              </p>
            )}

            {/* CTA */}
            <span className={`text-xs mt-1 ${
              isOwn ? "text-green-600/80" : "text-muted-foreground"
            }`}>
              {isLoading ? "Carregando..." : "Toque para ver →"}
            </span>
          </div>
        </div>
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
