import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PostLikeUser {
  user_id: string;
  username: string;
  full_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  conta_verificada: boolean;
}

export const usePostLikes = (postId: string, enabled = true) => {
  return useQuery({
    queryKey: ["post-likes", postId],
    queryFn: async (): Promise<PostLikeUser[]> => {
      const { data, error } = await supabase
        .from("likes")
        .select(`
          user_id,
          profile:profiles!likes_user_id_fkey (
            id,
            username,
            full_name,
            nickname,
            avatar_url,
            conta_verificada
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((like) => ({
        user_id: like.user_id,
        username: (like.profile as any)?.username || "",
        full_name: (like.profile as any)?.full_name || null,
        nickname: (like.profile as any)?.nickname || null,
        avatar_url: (like.profile as any)?.avatar_url || null,
        conta_verificada: (like.profile as any)?.conta_verificada || false,
      }));
    },
    enabled: !!postId && enabled,
  });
};

// Hook to fetch recent likes for multiple posts (used in feed)
export const useRecentPostLikes = (postIds: string[]) => {
  return useQuery({
    queryKey: ["recent-post-likes", postIds.join(",")],
    queryFn: async (): Promise<Record<string, PostLikeUser[]>> => {
      if (postIds.length === 0) return {};

      const { data, error } = await supabase
        .from("likes")
        .select(`
          post_id,
          user_id,
          created_at,
          profile:profiles!likes_user_id_fkey (
            id,
            username,
            full_name,
            nickname,
            avatar_url,
            conta_verificada
          )
        `)
        .in("post_id", postIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by post_id and take only 3 most recent
      const grouped: Record<string, PostLikeUser[]> = {};
      
      for (const like of data || []) {
        if (!grouped[like.post_id]) {
          grouped[like.post_id] = [];
        }
        if (grouped[like.post_id].length < 3) {
          grouped[like.post_id].push({
            user_id: like.user_id,
            username: (like.profile as any)?.username || "",
            full_name: (like.profile as any)?.full_name || null,
            nickname: (like.profile as any)?.nickname || null,
            avatar_url: (like.profile as any)?.avatar_url || null,
            conta_verificada: (like.profile as any)?.conta_verificada || false,
          });
        }
      }

      return grouped;
    },
    enabled: postIds.length > 0,
  });
};
