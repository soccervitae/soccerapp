import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Video, MoreVertical, Trash2, Archive, ArchiveRestore, BellOff, BellRing, Pin, PinOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { usePresenceContext } from "@/contexts/PresenceContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ChatHeaderProps {
  participant: Profile | null;
  isTyping?: boolean;
  onVideoCall?: () => void;
  onVoiceCall?: () => void;
  isCallActive?: boolean;
  onArchive?: () => void;
  onDelete?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  isArchived?: boolean;
}

export const ChatHeader = ({ participant, isTyping, onVideoCall, onVoiceCall, isCallActive, onArchive, onDelete, isMuted, onToggleMute, isPinned, onTogglePin, isArchived }: ChatHeaderProps) => {
  const navigate = useNavigate();
  const { isUserOnline } = usePresenceContext();
  const isOnline = participant?.id ? isUserOnline(participant.id) : false;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-2 h-14 flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-transparent">
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative">
          <Avatar className="h-9 w-9">
            <AvatarImage src={participant?.avatar_url || ""} alt={participant?.username || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {getInitials(participant?.full_name || participant?.username || "?")}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground truncate">
            {participant?.full_name || participant?.username || "Usuário"}
          </h1>
          <p className="text-xs truncate">
            {isTyping ? (
              <span className="text-primary animate-pulse">digitando...</span>
            ) : isOnline ? (
              <span className="text-green-500">online</span>
            ) : participant?.last_seen_at ? (
              <span className="text-muted-foreground">
                visto {formatDistanceToNow(new Date(participant.last_seen_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {participant?.username && `@${participant.username}`}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Call buttons and menu */}
      <div className="flex items-center gap-1">
        {/* Voice call button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onVoiceCall}
          disabled={!participant || isCallActive}
          className="text-primary hover:text-primary/80"
        >
          <Phone className="h-5 w-5" />
        </Button>

        {/* Video call button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onVideoCall}
          disabled={!participant || isCallActive}
          className="text-primary hover:text-primary/80"
        >
          <Video className="h-5 w-5" />
        </Button>

        {/* Options menu (3 dots) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card">
            <DropdownMenuItem onClick={onTogglePin} className="gap-2 cursor-pointer">
              {isPinned ? (
                <>
                  <PinOff className="h-4 w-4" />
                  Desafixar conversa
                </>
              ) : (
                <>
                  <Pin className="h-4 w-4" />
                  Fixar conversa
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onToggleMute} className="gap-2 cursor-pointer">
              {isMuted ? (
                <>
                  <BellRing className="h-4 w-4" />
                  Ativar notificações
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4" />
                  Silenciar notificações
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onArchive} className="gap-2 cursor-pointer">
              {isArchived ? (
                <>
                  <ArchiveRestore className="h-4 w-4" />
                  Desarquivar conversa
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4" />
                  Arquivar conversa
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4" />
              Apagar conversa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};