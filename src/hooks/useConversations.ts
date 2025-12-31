import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  cacheConversations,
  getCachedConversations,
  isOnline,
} from "@/lib/offlineStorage";
import type { Database } from "@/integrations/supabase/types";

type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Message = Database["public"]["Tables"]["messages"]["Row"];

export interface ConversationWithDetails extends Conversation {
  participant: Profile | null;
  lastMessage: Message | null;
  unreadCount: number;
}

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [isOffline, setIsOffline] = useState(!isOnline());
  const { showNotification, isGranted } = usePushNotifications();
  const previousMessagesRef = useRef<Map<string, string>>(new Map());

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

  const fetchConversations = async (isRefetch = false) => {
    if (!user) return;
    
    if (isRefetch) {
      setIsFetching(true);
    }

    // If offline, load from cache
    if (!isOnline()) {
      try {
        const cached = await getCachedConversations() as ConversationWithDetails[];
        setConversations(cached);
        setTotalUnread(cached.reduce((acc: number, c: ConversationWithDetails) => acc + (c.unreadCount || 0), 0));
      } catch (error) {
        console.error("Error loading cached conversations:", error);
      }
      setIsLoading(false);
      return;
    }

    try {
      // Get all conversation IDs where user is participant
      const { data: participations, error: partError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (partError) throw partError;

      if (!participations || participations.length === 0) {
        setConversations([]);
        setIsLoading(false);
        return;
      }

      const conversationIds = participations.map((p) => p.conversation_id);

      // Get conversations
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      if (convError) throw convError;

      // For each conversation, get the other participant and last message
      const conversationsWithDetails: ConversationWithDetails[] = await Promise.all(
        (convData || []).map(async (conv) => {
          // Get other participant
          const { data: participants } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", conv.id)
            .neq("user_id", user.id)
            .single();

          let participant: Profile | null = null;
          if (participants) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", participants.user_id)
              .single();
            participant = profile;
          }

          // Get last message
          const { data: lastMessageData } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conv.id)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          // Count unread messages (handles NULL and empty read_by arrays)
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .neq("sender_id", user.id)
            .is("deleted_at", null)
            .or(`read_by.is.null,not.read_by.cs.{${user.id}}`);

          return {
            ...conv,
            participant,
            lastMessage: lastMessageData,
            unreadCount: count || 0,
          };
        })
      );

      setConversations(conversationsWithDetails);
      setTotalUnread(conversationsWithDetails.reduce((acc, c) => acc + c.unreadCount, 0));

      // Cache conversations for offline use
      try {
        await cacheConversations(conversationsWithDetails);
      } catch (cacheError) {
        console.error("Error caching conversations:", cacheError);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      // Try to load from cache on error
      try {
        const cached = await getCachedConversations();
        if (cached.length > 0) {
          setConversations(cached as ConversationWithDetails[]);
        }
      } catch (cacheError) {
        console.error("Error loading cached conversations:", cacheError);
      }
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  const handleNewMessage = useCallback(
    async (payload: { new: Message }) => {
      const newMessage = payload.new;
      
      // Don't notify for own messages
      if (newMessage.sender_id === user?.id) return;

      // Check if we've already notified about this message
      const previousMessageId = previousMessagesRef.current.get(newMessage.conversation_id);
      if (previousMessageId === newMessage.id) return;
      
      previousMessagesRef.current.set(newMessage.conversation_id, newMessage.id);

      // Fetch sender info
      const { data: sender } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", newMessage.sender_id)
        .single();

      const senderName = sender?.full_name || sender?.username || "Alguém";
      let messagePreview = newMessage.content;
      
      if (newMessage.media_type === "audio") {
        messagePreview = "🎤 Mensagem de voz";
      } else if (newMessage.media_type === "image") {
        messagePreview = "📷 Foto";
      } else if (newMessage.media_type === "video") {
        messagePreview = "🎥 Vídeo";
      }

      // Show push notification
      if (isGranted) {
        showNotification(
          senderName,
          messagePreview,
          `/messages/${newMessage.conversation_id}`,
          newMessage.conversation_id
        );
      }

      // Refresh conversations
      fetchConversations();
    },
    [user, isGranted, showNotification]
  );

  useEffect(() => {
    fetchConversations();
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("conversations-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          handleNewMessage({ new: payload.new as Message });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, handleNewMessage]);

  return {
    conversations,
    isLoading,
    isFetching,
    isOffline,
    totalUnread,
    refetch: () => fetchConversations(true),
  };
};
