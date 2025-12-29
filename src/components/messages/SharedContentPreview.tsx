import { useNavigate } from "react-router-dom";
import { Image, Play, Star } from "lucide-react";

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
  const navigate = useNavigate();

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

  const handleClick = () => {
    // Navigate to the content URL
    if (data.url) {
      try {
        const url = new URL(data.url);
        // If it's an internal URL, use navigate
        if (url.origin === window.location.origin) {
          navigate(url.pathname + url.search);
        } else {
          window.open(data.url, "_blank");
        }
      } catch {
        // If URL parsing fails, try as relative path
        navigate(data.url);
      }
    }
  };

  const ContentIcon = getContentIcon();
  const truncatedTitle = data.title 
    ? data.title.length > 60 
      ? data.title.substring(0, 60) + "..." 
      : data.title
    : null;

  return (
    <button
      onClick={handleClick}
      className={`w-full rounded-xl overflow-hidden border transition-all hover:opacity-90 active:scale-[0.98] ${
        isOwn 
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
          : "bg-background/80 border-border"
      }`}
    >
      <div className="flex gap-3 p-2">
        {/* Thumbnail */}
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {data.preview ? (
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
          {data.contentType === "story" && data.preview && (
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
            Toque para ver →
          </span>
        </div>
      </div>
    </button>
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
