import { useState, useMemo, useEffect } from "react";
import { Play } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostMediaViewer } from "@/components/feed/PostMediaViewer";
import type { Post } from "@/hooks/usePosts";

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

  // Preload preview image and author avatar on mount
  useEffect(() => {
    if (data.preview) {
      preloadImage(data.preview);
    }
    if (data.author?.avatar_url) {
      preloadImage(data.author.avatar_url);
    }
  }, [data.preview, data.author?.avatar_url]);

  // Create Post object from available data - no fetch needed!
  const postData = useMemo<Post>(() => {
    const mediaUrl = data.preview || "";
    const isVideo = data.contentType === "story" || mediaUrl.endsWith(".webm") || mediaUrl.endsWith(".mp4");
    
    return {
      id: data.contentId,
      user_id: "",
      content: data.title || "",
      media_url: mediaUrl,
      media_type: isVideo ? "video" : "image",
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      created_at: new Date().toISOString(),
      updated_at: null,
      location_name: null,
      location_lat: null,
      location_lng: null,
      music_track_id: null,
      music_start_seconds: null,
      music_end_seconds: null,
      music_track: null,
      profile: {
        id: "",
        username: data.author?.username || "Usuário",
        full_name: data.author?.username || null,
        avatar_url: data.author?.avatar_url || null,
        nickname: null,
        position: null,
        team: null,
        conta_verificada: false,
      },
      liked_by_user: false,
      saved_by_user: false,
      recent_likes: [],
    };
  }, [data]);

  const mediaUrls = useMemo(() => {
    if (!data.preview) return [];
    return [data.preview];
  }, [data.preview]);

  const mediaType = useMemo(() => {
    const isVideo = data.contentType === "story" || 
      (data.preview && (data.preview.endsWith(".webm") || data.preview.endsWith(".mp4")));
    return isVideo ? "video" : "image";
  }, [data.contentType, data.preview]);

  const handleClick = () => {
    setViewerOpen(true);
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
          
          {/* Play overlay for video content */}
          {isVideoContent && data.preview && (
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
