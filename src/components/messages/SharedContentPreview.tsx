import { useState, useEffect } from "react";
import { Play, Loader2 } from "lucide-react";
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

// Preload image into browser cache
const preloadImage = (src: string) => {
  const img = new Image();
  img.src = src;
};

export const SharedContentPreview = ({ data }: SharedContentPreviewProps) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedPost, setFetchedPost] = useState<Post | null>(null);
  const [fetchedMediaUrls, setFetchedMediaUrls] = useState<string[]>([]);
  const [highlightData, setHighlightData] = useState<SharedHighlight | null>(null);

  // Preload preview image and author avatar on mount
  useEffect(() => {
    if (data.preview) {
      preloadImage(data.preview);
    }
    if (data.author?.avatar_url) {
      preloadImage(data.author.avatar_url);
    }
  }, [data.preview, data.author?.avatar_url]);

  // Reset loading state when viewer closes
  useEffect(() => {
    if (!viewerOpen) {
      setIsLoading(false);
    }
  }, [viewerOpen]);

  const handleClick = async () => {
    setIsLoading(true);

    try {
      let realPost: Post | null = null;
      let mediaUrls: string[] = [];

      if (data.contentType === "post") {
        const sharedPost = await fetchSharedPost(data.contentId);
        if (sharedPost) {
          realPost = sharedPostToPost(sharedPost);
          // Handle carousel posts (multiple URLs in media_url)
          if (sharedPost.media_url) {
            if (sharedPost.media_type === "carousel") {
              try {
                mediaUrls = JSON.parse(sharedPost.media_url);
              } catch {
                mediaUrls = sharedPost.media_url.split(",").map((u) => u.trim());
              }
            } else {
              mediaUrls = [sharedPost.media_url];
            }
          }
        }
      } else if (data.contentType === "story") {
        const sharedStory = await fetchSharedStory(data.contentId);
        if (sharedStory) {
          realPost = storyToPost(sharedStory);
          mediaUrls = [sharedStory.media_url];
        }
      } else if (data.contentType === "highlight") {
        const sharedHighlight = await fetchSharedHighlight(data.contentId);
        if (sharedHighlight) {
          realPost = highlightToPost(sharedHighlight);
          setHighlightData(sharedHighlight);
          mediaUrls = sharedHighlight.images.map((img) => img.image_url);
        }
      }

      if (realPost) {
        setFetchedPost(realPost);
        setFetchedMediaUrls(mediaUrls);
        setViewerOpen(true);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching shared content:", error);
      setIsLoading(false);
    }
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
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

  // Determine media type for the viewer
  const viewerMediaType =
    fetchedPost?.media_type === "carousel"
      ? "image"
      : fetchedPost?.media_type === "video"
      ? "video"
      : "image";

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full max-w-[260px] rounded-lg overflow-hidden bg-muted/50 border border-border/50 transition-all hover:opacity-90 active:scale-[0.98]"
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
          {data.preview ? (
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
          
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
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
      {fetchedPost && (
        <PostMediaViewer
          post={fetchedPost}
          mediaUrls={fetchedMediaUrls}
          mediaType={viewerMediaType}
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
