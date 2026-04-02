import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatPopup } from "@/contexts/ChatPopupContext";
import { useMessages } from "@/hooks/useMessages";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useMessageReactions } from "@/hooks/useMessageReactions";
import { useConversationsContext } from "@/contexts/ConversationsContext";
import { useAuth } from "@/contexts/AuthContext";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Minus, Maximize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { MessageWithSender } from "@/hooks/useMessages";

export const DesktopChatPopup = () => {
  const { state, closeChat, toggleMinimize } = useChatPopup();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { refetch: refetchConversations } = useConversationsContext();
  const { messages, isLoading, isSending, sendMessage, deleteMessage } = useMessages(state.conversationId);
  const { typingUsers, startTyping, stopTyping, isAnyoneTyping } = useTypingIndicator(state.conversationId);
  const { fetchReactionsForMessages, addReaction, getReactionsForMessage } = useMessageReactions(state.conversationId);
  const [replyTo, setReplyTo] = useState<MessageWithSender | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch reactions when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const ids = messages.map(m => m.id).filter(id => !id.startsWith("pending-"));
      fetchReactionsForMessages(ids);
    }
  }, [messages, fetchReactionsForMessages]);

  // Refetch conversations to update unread
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const timer = setTimeout(() => refetchConversations(), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, messages.length, refetchConversations]);

  const handleSend = async (content: string, mediaUrl?: string, mediaType?: string, replyToMessageId?: string, isTemporary?: boolean) => {
    await sendMessage(content, mediaUrl, mediaType, replyToMessageId || replyTo?.id, isTemporary);
    setReplyTo(null);
  };

  const handleTyping = useCallback(() => {
    startTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => stopTyping(), 2000);
  }, [startTyping, stopTyping]);

  const handleOpenFullPage = () => {
    if (state.conversationId) {
      navigate(`/messages/${state.conversationId}`);
      closeChat();
    }
  };

  const participant = state.participant;
  const displayName = participant?.account_type === "time"
    ? participant.full_name
    : participant?.nickname || participant?.full_name || participant?.username || "";

  if (!state.isOpen || !state.conversationId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-5 right-5 z-50 flex flex-col bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
        style={{ width: 380, height: state.isMinimized ? "auto" : 520 }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card cursor-pointer select-none"
          onClick={toggleMinimize}
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={participant?.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-muted">
              {(displayName || "?")[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
            {isAnyoneTyping && (
              <p className="text-xs text-primary">digitando...</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenFullPage(); }}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Abrir página completa"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); toggleMinimize(); }}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); closeChat(); }}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages area */}
        {!state.isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 bg-background">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Envie uma mensagem para começar
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    reactions={getReactionsForMessage(msg.id)}
                    onAddReaction={(messageId, emoji) => addReaction(messageId, emoji)}
                    onReply={() => setReplyTo(msg)}
                    onDelete={(messageId) => deleteMessage(messageId)}
                  />
                ))
              )}
              {isAnyoneTyping && <TypingIndicator username={typingUsers[0]?.username} />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border bg-card">
              <ChatInput
                onSend={handleSend}
                isSending={isSending}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                onTyping={handleTyping}
              />
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
