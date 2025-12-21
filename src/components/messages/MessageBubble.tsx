import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { MessageWithSender } from "@/hooks/useMessages";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, CheckCheck, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageBubbleProps {
  message: MessageWithSender;
  onReply?: (message: MessageWithSender) => void;
}

export const MessageBubble = ({ message, onReply }: MessageBubbleProps) => {
  const { user } = useAuth();
  const isOwn = message.sender_id === user?.id;
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (date: string) => {
    return format(new Date(date), "HH:mm", { locale: ptBR });
  };

  const isRead = message.read_by && message.read_by.length > 1;

  const toggleAudio = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const percent = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(percent);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        }`}
      >
        {/* Reply preview */}
        {message.replyToMessage && (
          <div
            className={`text-xs mb-2 p-2 rounded-lg border-l-2 ${
              isOwn
                ? "bg-primary-foreground/10 border-primary-foreground/50"
                : "bg-background/50 border-primary/50"
            }`}
          >
            <p className="opacity-70 truncate">{message.replyToMessage.content}</p>
          </div>
        )}

        {/* Media content */}
        {message.media_url && (
          <div className="mb-2 rounded-lg overflow-hidden">
            {message.media_type === "audio" ? (
              <div className="flex items-center gap-2 min-w-[180px]">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleAudio}
                  className={`h-10 w-10 rounded-full ${
                    isOwn
                      ? "bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
                      : "bg-background/50 hover:bg-background/70"
                  }`}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </Button>

                <div className="flex-1">
                  <div className={`h-1 rounded-full overflow-hidden ${
                    isOwn ? "bg-primary-foreground/30" : "bg-border"
                  }`}>
                    <div
                      className={`h-full transition-all ${
                        isOwn ? "bg-primary-foreground" : "bg-primary"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className={`text-[10px] ${
                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}>
                    {audioRef.current?.duration
                      ? formatDuration(isPlaying ? audioRef.current.currentTime : audioRef.current.duration)
                      : "0:00"}
                  </span>
                </div>

                <audio
                  ref={audioRef}
                  src={message.media_url}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleAudioEnded}
                  onLoadedMetadata={() => setProgress(0)}
                  className="hidden"
                />
              </div>
            ) : message.media_type === "video" ? (
              <video
                src={message.media_url}
                controls
                className="max-w-full rounded-lg"
              />
            ) : (
              <img
                src={message.media_url}
                alt="Media"
                className="max-w-full rounded-lg"
              />
            )}
          </div>
        )}

        {/* Text content - hide emoji placeholders for audio */}
        {message.content && message.content !== "🎤" && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        )}

        {/* Time and read status */}
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
          <span className={`text-[10px] ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {formatTime(message.created_at)}
          </span>
          {isOwn && (
            <span className={`${isRead ? "text-primary-foreground" : "text-primary-foreground/50"}`}>
              {isRead ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
