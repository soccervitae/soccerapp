import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatPopup } from "@/contexts/ChatPopupContext";
import { useMessages, useCreateConversation } from "@/hooks/useMessages";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useMessageReactions } from "@/hooks/useMessageReactions";
import { useConversationsContext } from "@/contexts/ConversationsContext";
import { usePresenceContext } from "@/contexts/PresenceContext";
import { useAuth } from "@/contexts/AuthContext";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Minus, Maximize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MessageWithSender } from "@/hooks/useMessages";

const ContactPickerView = () => {
  const { user } = useAuth();
  const { openChat, closeChat } = useChatPopup();
  const { createConversation } = useCreateConversation();
  const { conversations } = useConversationsContext();
  const { isUserOnline } = usePresenceContext();
  const [search, setSearch] = useState("");

  const { data: followingUsers = [] } = useQuery({
    queryKey: ["following-users-picker", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: following } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      if (!following || following.length === 0) return [];
      const followingIds = following.map(f => f.following_id);
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, nickname, account_type")
        .in("id", followingIds);
      return data || [];
    },
    enabled: !!user,
  });

  const contactList = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; username: string; full_name: string | null; avatar_url: string | null; nickname?: string | null; account_type?: string | null; isOnline: boolean }[] = [];

    conversations.forEach((conv: any) => {
      if (conv.participant && !seen.has(conv.participant.id) && !conv.participant.is_official_account) {
        seen.add(conv.participant.id);
        result.push({
          ...conv.participant,
          isOnline: isUserOnline(conv.participant.id),
        });
      }
    });

    followingUsers.forEach((u: any) => {
      if (!seen.has(u.id) && !u.is_official_account) {
        seen.add(u.id);
        result.push({ ...u, isOnline: isUserOnline(u.id) });
      }
    });

    return result;
  }, [conversations, followingUsers, isUserOnline]);

  const filtered = search.trim()
    ? contactList.filter(u =>
        (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.nickname || "").toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase())
      )
    : contactList;

  const handleSelect = async (u: typeof contactList[0]) => {
    const conversationId = await createConversation(u.id);
    if (conversationId) {
      openChat(conversationId, {
        id: u.id,
        username: u.username,
        full_name: u.full_name,
        avatar_url: u.avatar_url,
        nickname: u.nickname,
        account_type: u.account_type,
      });
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <span className="material-symbols-outlined text-[22px] text-primary">chat</span>
        <h3 className="flex-1 text-sm font-semibold text-foreground">Nova conversa</h3>
        <button
          onClick={closeChat}
          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="px-3 py-2 border-b border-border">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar contato..."
          className="w-full px-3 py-2 text-sm rounded-lg bg-muted border-none outline-none text-foreground placeholder:text-muted-foreground"
          autoFocus
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <span className="material-symbols-outlined text-[32px] mb-2">person_search</span>
            <p className="text-sm">Nenhum contato encontrado</p>
          </div>
        ) : (
          filtered.map((u) => (
            <button
              key={u.id}
              onClick={() => handleSelect(u)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
            >
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={u.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {getInitials(u.full_name || u.username)}
                  </AvatarFallback>
                </Avatar>
                {u.isOnline && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground truncate">
                  {u.nickname || u.full_name || u.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
              </div>
              {u.isOnline && (
                <span className="text-[11px] text-green-600 font-medium">Online</span>
              )}
            </button>
          ))
        )}
      </div>
    </>
  );
};

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      const ids = messages.map(m => m.id).filter(id => !id.startsWith("pending-"));
      fetchReactionsForMessages(ids);
    }
  }, [messages, fetchReactionsForMessages]);

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

  if (!state.isOpen) return null;

  // Contact picker mode
  if (state.showContactPicker && !state.conversationId) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-5 right-5 z-50 flex flex-col bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
          style={{ width: 380, height: 480 }}
        >
          <ContactPickerView />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!state.conversationId) return null;

  const participant = state.participant;
  const displayName = participant?.account_type === "time"
    ? participant.full_name
    : participant?.nickname || participant?.full_name || participant?.username || "";

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
