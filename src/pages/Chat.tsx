import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMessages } from "@/hooks/useMessages";
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
import { ResponsiveAlertModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useMessageReactions } from "@/hooks/useMessageReactions";
import { ChatHeader } from "@/components/messages/ChatHeader";
import { MessageBubble } from "@/components/messages/MessageBubble";
import { TypingIndicator } from "@/components/messages/TypingIndicator";
import { ChatInput } from "@/components/messages/ChatInput";
import { OfflineIndicator } from "@/components/messages/OfflineIndicator";
import { ChatSkeleton } from "@/components/skeletons/ChatSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useConversationsContext } from "@/contexts/ConversationsContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import type { MessageWithSender } from "@/hooks/useMessages";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const Chat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refetch: refetchConversations } = useConversationsContext();
  const { messages, isLoading, isSending, isOffline, sendMessage, deleteMessage } = useMessages(conversationId || null);
  const { typingUsers, startTyping, stopTyping, isAnyoneTyping } = useTypingIndicator(conversationId || null);
  const { fetchReactionsForMessages, addReaction, removeReaction, getReactionsForMessage } = useMessageReactions(conversationId || null);
  const [participant, setParticipant] = useState<Profile | null>(null);
  const [participantLoaded, setParticipantLoaded] = useState(false);
  const [replyTo, setReplyTo] = useState<MessageWithSender | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeletedUserDeleteDialog, setShowDeletedUserDeleteDialog] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [isDeletedUser, setIsDeletedUser] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refetch conversations when messages load to update unread badges
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const timer = setTimeout(() => refetchConversations(), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, messages.length, refetchConversations]);


  // Fetch other participant, mute and pin status
  useEffect(() => {
    const fetchParticipantAndStatus = async () => {
      if (!conversationId || !user) return;

      setParticipantLoaded(false);

      // Fetch mute, pin and archive status for current user
      const { data: currentParticipation } = await supabase
        .from("conversation_participants")
        .select("is_muted, is_pinned, is_archived")
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id)
        .single();

      setIsMuted(currentParticipation?.is_muted || false);
      setIsPinned(currentParticipation?.is_pinned || false);
      setIsArchived(currentParticipation?.is_archived || false);

      // Fetch other participant
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
        setIsDeletedUser(!profile);
      }
      setParticipantLoaded(true);
    };

    fetchParticipantAndStatus();
  }, [conversationId, user]);

  // Fetch reactions when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const messageIds = messages.map((m) => m.id);
      fetchReactionsForMessages(messageIds);
    }
  }, [messages, fetchReactionsForMessages]);

  // Reset initial load when conversation changes
  useEffect(() => {
    setIsInitialLoad(true);
  }, [conversationId]);

  // Scroll to bottom on new messages or typing
  useEffect(() => {
    if (messages.length > 0 || isAnyoneTyping) {
      const scrollToBottom = () => {
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ 
            behavior: isInitialLoad ? "instant" : "smooth" 
          });
          
          if (isInitialLoad) {
            setIsInitialLoad(false);
          }
        });
      };

      if (isInitialLoad) {
        // Delay maior no carregamento inicial para permitir que mídia carregue
        setTimeout(scrollToBottom, 100);
      } else {
        scrollToBottom();
      }
    }
  }, [messages, isAnyoneTyping, isInitialLoad]);

  // Forçar scroll quando o loading terminar
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

  const handleTyping = useCallback(() => {
    startTyping();

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  }, [startTyping, stopTyping]);

  const handleSend = async (
    content: string,
    mediaUrl?: string,
    mediaType?: string,
    replyToMessageId?: string,
    isTemporary?: boolean
  ) => {
    stopTyping();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    await sendMessage(content, mediaUrl, mediaType, replyToMessageId, isTemporary);
  };

  const handleReply = (message: MessageWithSender) => {
    setReplyTo(message);
  };

  const handleDeleteMessage = async (messageId: string) => {
    await deleteMessage(messageId);
    toast.success("Mensagem apagada para todos");
  };

  const handleToggleArchiveConversation = async () => {
    if (!conversationId || !user) return;
    
    try {
      const newArchivedState = !isArchived;
      
      const { error } = await supabase
        .from("conversation_participants")
        .update({ is_archived: newArchivedState })
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      if (newArchivedState) {
        toast.success("Conversa arquivada");
        navigate("/messages");
      } else {
        toast.success("Conversa desarquivada");
        navigate("/messages");
      }
    } catch (error) {
      console.error("Error toggling archive:", error);
      toast.error(isArchived ? "Erro ao desarquivar conversa" : "Erro ao arquivar conversa");
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationId || !user) return;
    
    try {
      // Apagar todas as mensagens enviadas pelo usuário nesta conversa
      await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("sender_id", user.id);
      
      // Remover participação do usuário da conversa
      const { error } = await supabase
        .from("conversation_participants")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      toast.success("Conversa apagada");
      navigate("/messages");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Erro ao apagar conversa");
    }
  };

  const handleToggleMute = async () => {
    if (!conversationId || !user) return;

    try {
      const newMutedState = !isMuted;

      const { error } = await supabase
        .from("conversation_participants")
        .update({ is_muted: newMutedState })
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id);

      if (error) throw error;

      setIsMuted(newMutedState);
      toast.success(newMutedState ? "Conversa silenciada" : "Notificações ativadas");
    } catch (error) {
      console.error("Error toggling mute:", error);
      toast.error("Erro ao alterar configurações");
    }
  };

  const handleTogglePin = async () => {
    if (!conversationId || !user) return;

    try {
      const newPinnedState = !isPinned;

      const { error } = await supabase
        .from("conversation_participants")
        .update({ is_pinned: newPinnedState })
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id);

      if (error) throw error;

      setIsPinned(newPinnedState);
      toast.success(newPinnedState ? "Conversa fixada" : "Conversa desafixada");
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("Erro ao alterar configurações");
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return <ChatSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ChatHeader 
        participant={participant} 
        isTyping={isAnyoneTyping}
        onVideoCall={handleVideoCall}
        onVoiceCall={handleVoiceCall}
        isCallActive={isCallActive}
        onArchive={handleToggleArchiveConversation}
        onDelete={() => setShowDeleteDialog(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isPinned={isPinned}
        onTogglePin={handleTogglePin}
        isArchived={isArchived}
        isDeletedUser={isDeletedUser}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Todas as suas mensagens nesta conversa serão apagadas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Incoming call modal */}
      <IncomingCallModal
        isOpen={isIncomingCall}
        caller={callerInfo}
        callType={callType || 'video'}
        onAccept={acceptCall}
        onReject={rejectCall}
      />

      {/* Video call modal */}
      {callType === 'video' && (
        <VideoCallModal
          isOpen={isCallActive || isCalling}
          participant={participant}
          localStream={localStream}
          remoteStream={remoteStream}
          isCalling={isCalling}
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          connectionStatus={connectionStatus}
          onToggleVideo={toggleVideo}
          onToggleAudio={toggleAudio}
          onEndCall={endCall}
        />
      )}

      {/* Voice call modal */}
      {callType === 'voice' && (
        <VoiceCallModal
          isOpen={isCallActive || isCalling}
          participant={participant}
          remoteStream={remoteStream}
          isCalling={isCalling}
          isAudioEnabled={isAudioEnabled}
          connectionStatus={connectionStatus}
          onToggleAudio={toggleAudio}
          onEndCall={endCall}
        />
      )}

      {/* Offline indicator */}
      {isOffline && (
        <div className="fixed top-[50px] left-0 right-0 z-40 px-4 py-2">
          <OfflineIndicator />
        </div>
      )}

      {/* Messages area */}
      <div className={`flex-1 overflow-y-auto pb-24 px-2 ${isOffline ? 'pt-[74px]' : 'pt-[50px]'}`}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="material-symbols-outlined text-5xl text-muted-foreground mb-3">
              waving_hand
            </span>
            <p className="text-muted-foreground">
              Diga olá para {participant?.full_name || participant?.username}!
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message) => (
              <div
                key={message.id}
                className="group"
              >
                <MessageBubble 
                  message={message} 
                  onReply={handleReply}
                  reactions={getReactionsForMessage(message.id)}
                  onAddReaction={addReaction}
                  onRemoveReaction={removeReaction}
                  onDelete={handleDeleteMessage}
                />
              </div>
            ))}
            
            {/* Typing indicator */}
            {isAnyoneTyping && typingUsers.length > 0 && (
              <TypingIndicator username={typingUsers[0].username} />
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Fixed input at bottom - hidden for unknown users */}
      {(() => {
        const isUnknownUser = participantLoaded && !participant?.full_name && !participant?.username;
        if (!participantLoaded) return null;
        if (isUnknownUser) {
          return (
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Este usuário não está mais disponível
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => setShowDeletedUserDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
                Excluir conversa
              </Button>
            </div>
          );
        }
        
        return (
          <div className="fixed bottom-0 left-0 right-0">
            {isDeletedUser ? (
              <div className="bg-background border-t border-border p-4 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Este usuário não está mais disponível no SOCCER VITAE
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowDeletedUserDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir conversa
                </Button>
              </div>
            ) : (
              <ChatInput
                onSend={handleSend}
                isSending={isSending}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                onTyping={handleTyping}
              />
            )}
          </div>
        );
      })()}

      {/* Delete confirmation for deleted user */}
      <ResponsiveAlertModal
        open={showDeletedUserDeleteDialog}
        onOpenChange={setShowDeletedUserDeleteDialog}
        title="Excluir conversa?"
        description="Essa ação não pode ser desfeita. Todas as suas mensagens nesta conversa serão apagadas permanentemente."
        cancelText="Cancelar"
        confirmText="Excluir"
        onConfirm={handleDeleteConversation}
        confirmVariant="destructive"
      />
    </div>
  );
};

export default Chat;
