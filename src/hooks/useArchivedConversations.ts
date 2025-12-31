import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Message = Database["public"]["Tables"]["messages"]["Row"];

export interface ArchivedConversationWithDetails extends Conversation {
  participant: Profile | null;
  lastMessage: Message | null;
}

export const useArchivedConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ArchivedConversationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchArchivedConversations = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Get all archived conversation IDs where user is participant
      const { data: participations, error: partError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id)
        .eq("is_archived", true);

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
      const conversationsWithDetails: ArchivedConversationWithDetails[] = await Promise.all(
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

          return {
            ...conv,
            participant,
            lastMessage: lastMessageData,
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error("Error fetching archived conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const unarchiveConversation = async (conversationId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("conversation_participants")
        .update({ is_archived: false })
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Remove from local state
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      return true;
    } catch (error) {
      console.error("Error unarchiving conversation:", error);
      return false;
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!user) return false;

    try {
      // Delete user's messages in this conversation
      await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("sender_id", user.id);

      // Remove user's participation
      const { error } = await supabase
        .from("conversation_participants")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Remove from local state
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      return true;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchArchivedConversations();
  }, [fetchArchivedConversations]);

  return {
    conversations,
    isLoading,
    unarchiveConversation,
    deleteConversation,
    refetch: fetchArchivedConversations,
  };
};
