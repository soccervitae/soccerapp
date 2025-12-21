import { useAuth } from "@/contexts/AuthContext";
import type { MessageWithSender } from "@/hooks/useMessages";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  message: MessageWithSender;
  onReply?: (message: MessageWithSender) => void;
}

export const MessageBubble = ({ message, onReply }: MessageBubbleProps) => {
  const { user } = useAuth();
  const isOwn = message.sender_id === user?.id;

  const formatTime = (date: string) => {
    return format(new Date(date), "HH:mm", { locale: ptBR });
  };

  const isRead = message.read_by && message.read_by.length > 1;

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
            {message.media_type === "video" ? (
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

        {/* Text content */}
        {message.content && (
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
