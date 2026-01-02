import { useState } from "react";
import { Play, ImageOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MediaPreviewProps {
  src: string;
  alt?: string;
  className?: string;
  showPlayIcon?: boolean;
  fallbackClassName?: string;
}

// List of unsupported browser image formats
const UNSUPPORTED_FORMATS = ['.dng', '.raw', '.cr2', '.nef', '.arw', '.orf', '.rw2'];

const isUnsupportedFormat = (url: string): boolean => {
  const lowerUrl = url.toLowerCase();
  return UNSUPPORTED_FORMATS.some(ext => lowerUrl.endsWith(ext));
};

const isVideoUrl = (url: string): boolean => {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.mp4') || 
         lowerUrl.includes('.mov') || 
         lowerUrl.includes('.webm') || 
         lowerUrl.includes('.avi') ||
         lowerUrl.includes('video');
};

export const MediaPreview = ({ 
  src, 
  alt = "Media preview", 
  className = "",
  showPlayIcon = true,
  fallbackClassName = "",
}: MediaPreviewProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const isVideo = isVideoUrl(src);
  const isUnsupported = isUnsupportedFormat(src);
  
  // If the format is unsupported, show fallback immediately
  if (isUnsupported || hasError) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-muted to-muted/50 ${fallbackClassName || className}`}>
        <div className="flex flex-col items-center gap-1">
          <ImageOff className="w-6 h-6 text-muted-foreground/60" />
          {isVideo && showPlayIcon && (
            <Play className="w-4 h-4 text-muted-foreground/60 fill-muted-foreground/60" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading skeleton */}
      {isLoading && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      
      {/* Image */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
      
      {/* Play icon overlay for videos */}
      {isVideo && showPlayIcon && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaPreview;
