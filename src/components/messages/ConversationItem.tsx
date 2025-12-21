import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ConversationWithDetails } from "@/hooks/useConversations";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConversationItemProps {
  conversation: ConversationWithDetails;
  onClick: () => void;
}

export const ConversationItem = ({ conversation, onClick }: ConversationItemProps) => {
  const { participant, lastMessage, unreadCount } = conversation;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
  };

  const truncateMessage = (text: string, maxLength: number = 40) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors rounded-lg"
    >
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={participant?.avatar_url || ""} alt={participant?.username || ""} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(participant?.full_name || participant?.username || "?")}
          </AvatarFallback>
        </Avatar>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center bg-primary text-primary-foreground text-xs font-medium rounded-full px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between">
          <span className={`font-medium text-foreground ${unreadCount > 0 ? "font-semibold" : ""}`}>
            {participant?.full_name || participant?.username || "Usuário"}
          </span>
          {lastMessage && (
            <span className="text-xs text-muted-foreground">
              {formatTime(lastMessage.created_at)}
            </span>
          )}
        </div>
        <p className={`text-sm truncate ${unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
          {lastMessage ? (
            lastMessage.media_url ? (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  {lastMessage.media_type === "video" ? "videocam" : "image"}
                </span>
                {lastMessage.media_type === "video" ? "Vídeo" : "Foto"}
              </span>
            ) : (
              truncateMessage(lastMessage.content)
            )
          ) : (
            "Iniciar conversa..."
          )}
        </p>
      </div>
    </button>
  );
};
