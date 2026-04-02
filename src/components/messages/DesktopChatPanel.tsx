import { useState, useEffect, useRef, useCallback } from "react";
import { useMessages } from "@/hooks/useMessages";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useMessageReactions } from "@/hooks/useMessageReactions";
import { MessageBubble } from "@/components/messages/MessageBubble";
import { TypingIndicator } from "@/components/messages/TypingIndicator";
import { ChatInput } from "@/components/messages/ChatInput";
import { OfflineIndicator } from "@/components/messages/OfflineIndicator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useConversationsContext } from "@/contexts/ConversationsContext";
import { usePresenceContext } from "@/contexts/PresenceContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Archive, ArchiveRestore, BellOff, Bell, Pin, PinOff, Trash2, MoreVertical, MessageCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/integrations/supabase/types";
import type { MessageWithSender } from "@/hooks/useMessages";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface DesktopChatPanelProps {
  conversationId: string | null;
}

export const DesktopChatPanel = ({ conversationId }: DesktopChatPanelProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { refetch: refetchConversations } = useConversationsContext();
  const { isUserOnline } = usePresenceContext();
  const { messages, isLoading, isSending, isOffline, sendMessage, deleteMessage } = useMessages(conversationId);
  const { typingUsers, startTyping, stopTyping, isAnyoneTyping } = useTypingIndicator(conversationId);
  const { fetchReactionsForMessages, addReaction, removeReaction, getReactionsForMessage } = useMessageReactions(conversationId);
  
  const [participant, setParticipant] = useState<Profile | null>(null);
  const [participantLoaded, setParticipantLoaded] = useState(false);
  const [replyTo, setReplyTo] = useState<MessageWithSender | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refetch conversations when messages load
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const timer = setTimeout(() => refetchConversations(), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, messages.length, refetchConversations]);

  // Fetch participant
  useEffect(() => {
    const fetchParticipant = async () => {
      if (!conversationId || !user) return;
      setParticipantLoaded(false);

      const { data: currentParticipation } = await supabase
        .from("conversation_participants")
        .select("is_muted, is_pinned, is_archived")
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id)
        .single();

      setIsMuted(currentParticipation?.is_muted || false);
      setIsPinned(currentParticipation?.is_pinned || false);
      setIsArchived(currentParticipation?.is_archived || false);

      const { data: otherParticipant } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conversationId)
        .neq("user_id", user.id)
        .single();

      if (otherParticipant) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", otherParticipant.user_id)
          .single();
        setParticipant(profile);
      }
      setParticipantLoaded(true);
    };

    fetchParticipant();
  }, [conversationId, user]);

  // Fetch reactions
  useEffect(() => {
    if (messages.length > 0) {
      fetchReactionsForMessages(messages.map(m => m.id));
    }
  }, [messages, fetchReactionsForMessages]);

  // Reset initial load
  useEffect(() => {
    setIsInitialLoad(true);
  }, [conversationId]);

  // Scroll to bottom
  useEffect(() => {
    if (messages.length > 0 || isAnyoneTyping) {
      const scrollToBottom = () => {
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({
            behavior: isInitialLoad ? "instant" : "smooth",
          });
          if (isInitialLoad) setIsInitialLoad(false);
        });
      };
      if (isInitialLoad) {
        setTimeout(scrollToBottom, 100);
      } else {
        scrollToBottom();
      }
    }
  }, [messages, isAnyoneTyping, isInitialLoad]);

  useEffect(() => {
    if (!isLoading && messages.length > 0 && isInitialLoad) {
      const timer = setTimeout(() => {
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isLoading, messages.length, isInitialLoad]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleTyping = useCallback(() => {
    startTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => stopTyping(), 2000);
  }, [startTyping, stopTyping]);

  const handleSend = async (content: string, mediaUrl?: string, mediaType?: string, replyToMessageId?: string, isTemporary?: boolean) => {
    stopTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    await sendMessage(content, mediaUrl, mediaType, replyToMessageId, isTemporary);
  };

  const handleDeleteMessage = async (messageId: string) => {
    await deleteMessage(messageId);
    toast.success("Mensagem apagada para todos");
  };

  const handleToggleMute = async () => {
    if (!conversationId || !user) return;
    const newState = !isMuted;
    const { error } = await supabase.from("conversation_participants").update({ is_muted: newState }).eq("conversation_id", conversationId).eq("user_id", user.id);
    if (!error) { setIsMuted(newState); toast.success(newState ? "Conversa silenciada" : "Notificações ativadas"); }
  };

  const handleTogglePin = async () => {
    if (!conversationId || !user) return;
    const newState = !isPinned;
    const { error } = await supabase.from("conversation_participants").update({ is_pinned: newState }).eq("conversation_id", conversationId).eq("user_id", user.id);
    if (!error) { setIsPinned(newState); toast.success(newState ? "Conversa fixada" : "Conversa desafixada"); }
  };

  const handleToggleArchive = async () => {
    if (!conversationId || !user) return;
    const newState = !isArchived;
    const { error } = await supabase.from("conversation_participants").update({ is_archived: newState }).eq("conversation_id", conversationId).eq("user_id", user.id);
    if (!error) {
      toast.success(newState ? "Conversa arquivada" : "Conversa desarquivada");
      refetchConversations();
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationId || !user) return;
    await supabase.from("messages").delete().eq("conversation_id", conversationId).eq("sender_id", user.id);
    const { error } = await supabase.from("conversation_participants").delete().eq("conversation_id", conversationId).eq("user_id", user.id);
    if (!error) { toast.success("Conversa apagada"); refetchConversations(); }
  };

  const isOnline = participant?.id ? isUserOnline(participant.id) : false;

  // Empty state
  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
        <MessageCircle className="h-16 w-16 mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-1">Suas mensagens</h3>
        <p className="text-sm">Selecione uma conversa para começar</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div><Skeleton className="h-4 w-32 mb-1" /><Skeleton className="h-3 w-20" /></div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "" : "justify-end"}`}>
              <Skeleton className={`h-10 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-40"}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => participant && navigate(`/${participant.username}`)}
        >
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={participant?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {(participant?.full_name || participant?.username || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
            )}
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">
              {participant?.account_type === "Time"
                ? (participant?.full_name || participant?.username)
                : (participant?.nickname || participant?.full_name || participant?.username)}
            </p>
            <p className="text-xs text-muted-foreground">
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleToggleMute}>
              {isMuted ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
              {isMuted ? "Ativar notificações" : "Silenciar"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleTogglePin}>
              {isPinned ? <PinOff className="h-4 w-4 mr-2" /> : <Pin className="h-4 w-4 mr-2" />}
              {isPinned ? "Desafixar" : "Fixar"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleToggleArchive}>
              {isArchived ? <ArchiveRestore className="h-4 w-4 mr-2" /> : <Archive className="h-4 w-4 mr-2" />}
              {isArchived ? "Desarquivar" : "Arquivar"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Apagar conversa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {isOffline && (
          <div className="mb-2"><OfflineIndicator /></div>
        )}
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="material-symbols-outlined text-5xl text-muted-foreground mb-3">waving_hand</span>
            <p className="text-muted-foreground">Diga olá para {participant?.full_name || participant?.username}!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message) => (
              <div key={message.id} className="group">
                <MessageBubble
                  message={message}
                  onReply={(msg) => setReplyTo(msg)}
                  reactions={getReactionsForMessage(message.id)}
                  onAddReaction={addReaction}
                  onRemoveReaction={removeReaction}
                  onDelete={handleDeleteMessage}
                />
              </div>
            ))}
            {isAnyoneTyping && typingUsers.length > 0 && (
              <TypingIndicator username={typingUsers[0].username} />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border">
        <ChatInput
          onSend={handleSend}
          isSending={isSending}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onTyping={handleTyping}
        />
      </div>

      {/* Delete dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Todas as suas mensagens serão apagadas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConversation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
