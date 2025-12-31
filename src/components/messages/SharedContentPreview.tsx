import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostMediaViewer } from "@/components/feed/PostMediaViewer";
import type { Post } from "@/hooks/usePosts";
import {
  fetchSharedPost,
  fetchSharedStory,
  fetchSharedHighlight,
  sharedPostToPost,
  storyToPost,
  highlightToPost,
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
  
  // Unified viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [postData, setPostData] = useState<Post | null>(null);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<string | null>(null);

  const parseMediaUrls = (mediaUrl: string | null, type: string | null): string[] => {
    if (!mediaUrl) return [];
    if (type === "carousel") {
      try {
        return JSON.parse(mediaUrl);
      } catch {
        return [mediaUrl];
      }
    }
    return [mediaUrl];
  };

  const handleClick = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      switch (data.contentType) {
        case "post": {
          const post = await fetchSharedPost(data.contentId);
          if (post) {
            const postForViewer = sharedPostToPost(post);
            const urls = parseMediaUrls(post.media_url, post.media_type);
            setPostData(postForViewer);
            setMediaUrls(urls);
            setMediaType(post.media_type);
            setViewerOpen(true);
          } else {
            toast.error("Publicação não encontrada");
          }
          break;
        }
        
        case "story": {
          const story = await fetchSharedStory(data.contentId);
          if (story) {
            setPostData(storyToPost(story));
            setMediaUrls([story.media_url]);
            setMediaType(story.media_type);
            setViewerOpen(true);
          } else {
            toast.error("Replay não encontrado ou expirado");
          }
          break;
        }
        
        case "highlight": {
          const highlight = await fetchSharedHighlight(data.contentId);
          if (highlight) {
            setPostData(highlightToPost(highlight));
            setMediaUrls(highlight.images.map(img => img.image_url));
            setMediaType(highlight.images.length > 1 ? "carousel" : (highlight.images[0]?.media_type || "image"));
            setViewerOpen(true);
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

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setPostData(null);
    setMediaUrls([]);
    setMediaType(null);
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

      {/* Unified Post Media Viewer */}
      {postData && (
        <PostMediaViewer
          post={postData}
          mediaUrls={mediaUrls}
          mediaType={mediaType}
          isOpen={viewerOpen}
          onClose={handleCloseViewer}
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
