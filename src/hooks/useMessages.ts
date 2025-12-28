import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  cacheMessages,
  getCachedMessages,
  addPendingMessage,
  isOnline,
} from "@/lib/offlineStorage";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Message = Database["public"]["Tables"]["messages"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface MessageWithSender extends Message {
  sender: Profile | null;
  replyToMessage?: Message | null;
  isPending?: boolean;
}

export const useMessages = (conversationId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isOffline, setIsOffline] = useState(!isOnline());

  // Listen for online/offline changes
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) return;

    // If offline, load from cache
    if (!isOnline()) {
      try {
        const cached = await getCachedMessages(conversationId);
        setMessages(cached as MessageWithSender[]);
      } catch (error) {
        console.error("Error loading cached messages:", error);
      }
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch sender profiles
      const messagesWithSenders: MessageWithSender[] = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: sender } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", msg.sender_id)
            .single();

          let replyToMessage = null;
          if (msg.reply_to_message_id) {
            const { data: replyMsg } = await supabase
              .from("messages")
              .select("*")
              .eq("id", msg.reply_to_message_id)
              .single();
            replyToMessage = replyMsg;
          }

          return {
            ...msg,
            sender,
            replyToMessage,
          };
        })
      );

      setMessages(messagesWithSenders);

      // Cache messages for offline use
      try {
        await cacheMessages(messagesWithSenders);
      } catch (cacheError) {
        console.error("Error caching messages:", cacheError);
      }

      // Mark messages as read
      const unreadMessages = data?.filter(
        (msg) => msg.sender_id !== user.id && !msg.read_by?.includes(user.id)
      );

      if (unreadMessages && unreadMessages.length > 0) {
        for (const msg of unreadMessages) {
          await supabase
            .from("messages")
            .update({
              read_by: [...(msg.read_by || []), user.id],
            })
            .eq("id", msg.id);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      // Try to load from cache on error
      try {
        const cached = await getCachedMessages(conversationId);
        if (cached.length > 0) {
          setMessages(cached as MessageWithSender[]);
        }
      } catch (cacheError) {
        console.error("Error loading cached messages:", cacheError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, fetchMessages]);

  const sendMessage = async (
    content: string,
    mediaUrl?: string,
    mediaType?: string,
    replyToMessageId?: string,
    isTemporary?: boolean
  ) => {
    if (!conversationId || !user) return null;

    setIsSending(true);

    // If offline, store message for later
    if (!isOnline()) {
      try {
        const pendingMessage = {
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          media_url: mediaUrl,
          media_type: mediaType,
          reply_to_message_id: replyToMessageId,
          created_at: new Date().toISOString(),
          is_temporary: isTemporary || false,
          delete_after_read: isTemporary || false,
        };

        const tempId = await addPendingMessage(pendingMessage);

        // Add to local state with pending flag
        const optimisticMessage: MessageWithSender = {
          id: `pending-${tempId}`,
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          media_url: mediaUrl || null,
          media_type: mediaType || null,
          reply_to_message_id: replyToMessageId || null,
          created_at: new Date().toISOString(),
          deleted_at: null,
          delete_after_read: isTemporary || null,
          expires_at: null,
          is_temporary: isTemporary || null,
          read_by: null,
          sender: null,
          isPending: true,
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        return optimisticMessage;
      } catch (error) {
        console.error("Error saving offline message:", error);
        return null;
      } finally {
        setIsSending(false);
      }
    }

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          media_url: mediaUrl || null,
          media_type: mediaType || null,
          reply_to_message_id: replyToMessageId || null,
          is_temporary: isTemporary || false,
          delete_after_read: isTemporary || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error sending message:", error);
      return null;
    } finally {
      setIsSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", messageId);

      if (error) throw error;
      fetchMessages();
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  return {
    messages,
    isLoading,
    isSending,
    isOffline,
    sendMessage,
    deleteMessage,
    refetch: fetchMessages,
  };
};

export const useCreateConversation = () => {
  const { user } = useAuth();

  const findExistingConversation = async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;

    // Get all conversations where current user is participant
    const { data: myConversations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (!myConversations) return null;

    // Check if other user is in any of these conversations
    for (const conv of myConversations) {
      const { data: otherParticipant } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("conversation_id", conv.conversation_id)
        .eq("user_id", otherUserId)
        .single();

      if (otherParticipant) {
        return conv.conversation_id;
      }
    }

    return null;
  };

  const createConversation = async (otherUserId: string): Promise<string | null> => {
    if (!user) {
      toast.error("Você precisa estar logado para iniciar uma conversa");
      return null;
    }

    // Verificar sessão ativa antes de prosseguir
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Sessão expirada. Por favor, faça login novamente.");
      return null;
    }

    // Check if conversation already exists
    const existingId = await findExistingConversation(otherUserId);
    if (existingId) return existingId;

    try {
      // Use RPC function to create conversation (bypasses RLS with security definer)
      const { data, error } = await supabase.rpc('create_conversation_with_user', {
        p_other_user_id: otherUserId
      });

      if (error) throw error;

      return data as string;
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      toast.error("Não foi possível criar a conversa. Tente novamente.");
      return null;
    }
  };

  return { createConversation, findExistingConversation };
};
