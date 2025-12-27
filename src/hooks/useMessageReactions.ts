import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type MessageReaction = Database["public"]["Tables"]["message_reactions"]["Row"];

export interface ReactionWithUser extends MessageReaction {
  user_id: string;
}

export const useMessageReactions = (conversationId: string | null) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Map<string, ReactionWithUser[]>>(new Map());

  const fetchReactionsForMessages = useCallback(async (messageIds: string[]) => {
    if (!messageIds.length) return;

    try {
      const { data, error } = await supabase
        .from("message_reactions")
        .select("*")
        .in("message_id", messageIds);

      if (error) throw error;

      const reactionsMap = new Map<string, ReactionWithUser[]>();
      (data || []).forEach((reaction) => {
        const existing = reactionsMap.get(reaction.message_id) || [];
        reactionsMap.set(reaction.message_id, [...existing, reaction]);
      });

      setReactions(reactionsMap);
    } catch (error) {
      console.error("Error fetching reactions:", error);
    }
  }, []);

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      // Check if user already reacted with this emoji
      const existingReactions = reactions.get(messageId) || [];
      const existingReaction = existingReactions.find(
        (r) => r.user_id === user.id && r.emoji === emoji
      );

      if (existingReaction) {
        // Remove existing reaction
        await removeReaction(existingReaction.id);
        return;
      }

      const { data, error } = await supabase
        .from("message_reactions")
        .insert({
          message_id: messageId,
          user_id: user.id,
          emoji,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setReactions((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(messageId) || [];
        newMap.set(messageId, [...existing, data]);
        return newMap;
      });
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const removeReaction = async (reactionId: string) => {
    try {
      const { error } = await supabase
        .from("message_reactions")
        .delete()
        .eq("id", reactionId);

      if (error) throw error;

      // Update local state
      setReactions((prev) => {
        const newMap = new Map(prev);
        for (const [msgId, reacts] of newMap.entries()) {
          const filtered = reacts.filter((r) => r.id !== reactionId);
          if (filtered.length !== reacts.length) {
            newMap.set(msgId, filtered);
            break;
          }
        }
        return newMap;
      });
    } catch (error) {
      console.error("Error removing reaction:", error);
    }
  };

  const getReactionsForMessage = (messageId: string): ReactionWithUser[] => {
    return reactions.get(messageId) || [];
  };

  // Real-time subscription for reactions
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`reactions-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newReaction = payload.new as ReactionWithUser;
            setReactions((prev) => {
              const newMap = new Map(prev);
              const existing = newMap.get(newReaction.message_id) || [];
              if (!existing.find((r) => r.id === newReaction.id)) {
                newMap.set(newReaction.message_id, [...existing, newReaction]);
              }
              return newMap;
            });
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id;
            setReactions((prev) => {
              const newMap = new Map(prev);
              for (const [msgId, reacts] of newMap.entries()) {
                const filtered = reacts.filter((r) => r.id !== deletedId);
                if (filtered.length !== reacts.length) {
                  newMap.set(msgId, filtered);
                  break;
                }
              }
              return newMap;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return {
    reactions,
    fetchReactionsForMessages,
    addReaction,
    removeReaction,
    getReactionsForMessage,
  };
};
