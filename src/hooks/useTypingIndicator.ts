import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface TypingUser {
  id: string;
  username: string;
  isTyping: boolean;
}

export const useTypingIndicator = (conversationId: string | null) => {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!conversationId || !user) return;

    const presenceChannel = supabase.channel(`typing:${conversationId}`, {
      config: { presence: { key: user.id } },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const users: TypingUser[] = [];

        Object.entries(state).forEach(([userId, presences]) => {
          if (userId !== user.id && Array.isArray(presences) && presences.length > 0) {
            const presence = presences[0] as { username?: string; isTyping?: boolean };
            if (presence.isTyping) {
              users.push({
                id: userId,
                username: presence.username || "Usuário",
                isTyping: true,
              });
            }
          }
        });

        setTypingUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            isTyping: false,
            username: user.user_metadata?.username || user.email?.split("@")[0],
          });
        }
      });

    setChannel(presenceChannel);

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [conversationId, user]);

  const setTyping = useCallback(
    async (isTyping: boolean) => {
      if (!channel || !user) return;

      await channel.track({
        isTyping,
        username: user.user_metadata?.username || user.email?.split("@")[0],
      });
    },
    [channel, user]
  );

  const startTyping = useCallback(() => {
    setTyping(true);
  }, [setTyping]);

  const stopTyping = useCallback(() => {
    setTyping(false);
  }, [setTyping]);

  return {
    typingUsers,
    startTyping,
    stopTyping,
    isAnyoneTyping: typingUsers.length > 0,
  };
};
