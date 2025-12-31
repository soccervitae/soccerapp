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
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useMessageReactions } from "@/hooks/useMessageReactions";
import { useVideoCall } from "@/hooks/useVideoCall";
import { ChatHeader } from "@/components/messages/ChatHeader";
import { MessageBubble } from "@/components/messages/MessageBubble";
import { TypingIndicator } from "@/components/messages/TypingIndicator";
import { ChatInput } from "@/components/messages/ChatInput";
import { OfflineIndicator } from "@/components/messages/OfflineIndicator";
import { VideoCallModal } from "@/components/messages/VideoCallModal";
import { VoiceCallModal } from "@/components/messages/VoiceCallModal";
import { IncomingCallModal } from "@/components/messages/IncomingCallModal";
import { ChatSkeleton } from "@/components/skeletons/ChatSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import type { MessageWithSender } from "@/hooks/useMessages";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const Chat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, isLoading, isSending, isOffline, sendMessage, deleteMessage } = useMessages(conversationId || null);
  const { typingUsers, startTyping, stopTyping, isAnyoneTyping } = useTypingIndicator(conversationId || null);
  const { fetchReactionsForMessages, addReaction, removeReaction, getReactionsForMessage } = useMessageReactions(conversationId || null);
  const [participant, setParticipant] = useState<Profile | null>(null);
  const [replyTo, setReplyTo] = useState<MessageWithSender | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Video call hook
  const {
    isCallActive,
    isIncomingCall,
    isCalling,
    isVideoEnabled,
    isAudioEnabled,
    localStream,
    remoteStream,
    callerInfo,
    connectionStatus,
    callType,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio,
  } = useVideoCall(conversationId || null, participant);

  // Call handlers
  const handleVideoCall = useCallback(() => startCall('video'), [startCall]);
  const handleVoiceCall = useCallback(() => startCall('voice'), [startCall]);

  // Fetch other participant, mute and pin status
  useEffect(() => {
    const fetchParticipantAndStatus = async () => {
      if (!conversationId || !user) return;

      // Fetch mute and pin status for current user
      const { data: currentParticipation } = await supabase
        .from("conversation_participants")
        .select("is_muted, is_pinned")
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id)
        .single();

      setIsMuted(currentParticipation?.is_muted || false);
      setIsPinned(currentParticipation?.is_pinned || false);

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
      }
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

  const handleArchiveConversation = async () => {
    if (!conversationId || !user) return;
    
    try {
      const { error } = await supabase
        .from("conversation_participants")
        .update({ is_archived: true })
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      toast.success("Conversa arquivada");
      navigate("/messages");
    } catch (error) {
      console.error("Error archiving conversation:", error);
      toast.error("Erro ao arquivar conversa");
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
        onArchive={handleArchiveConversation}
        onDelete={() => setShowDeleteDialog(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isPinned={isPinned}
        onTogglePin={handleTogglePin}
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
          isOpen={isCallActive}
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
          isOpen={isCallActive}
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
        <div className="fixed top-14 left-0 right-0 z-40 px-4 py-2">
          <OfflineIndicator />
        </div>
      )}

      {/* Messages area */}
      <div className={`flex-1 overflow-y-auto pb-24 px-2 ${isOffline ? 'pt-28' : 'pt-16'}`}>
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

      {/* Fixed input at bottom */}
      <div className="fixed bottom-0 left-0 right-0">
        <ChatInput
          onSend={handleSend}
          isSending={isSending}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onTyping={handleTyping}
        />
      </div>
    </div>
  );
};

export default Chat;
