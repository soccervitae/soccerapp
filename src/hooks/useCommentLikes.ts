import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CommentLiker {
  user_id: string;
  username: string;
  full_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  conta_verificada: boolean;
}

export const useCommentLikes = (commentIds: string[]) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["comment-likes", commentIds.join(","), user?.id],
    queryFn: async () => {
      if (commentIds.length === 0) return { counts: {}, likedByUser: {} };

      // Get counts for each comment
      const { data: likesData, error: likesError } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .in("comment_id", commentIds);

      if (likesError) throw likesError;

      // Count likes per comment
      const counts: Record<string, number> = {};
      for (const like of likesData || []) {
        counts[like.comment_id] = (counts[like.comment_id] || 0) + 1;
      }

      // Check which comments user has liked
      const likedByUser: Record<string, boolean> = {};
      if (user) {
        const { data: userLikes, error: userLikesError } = await supabase
          .from("comment_likes")
          .select("comment_id")
          .in("comment_id", commentIds)
          .eq("user_id", user.id);

        if (userLikesError) throw userLikesError;

        for (const like of userLikes || []) {
          likedByUser[like.comment_id] = true;
        }
      }

      return { counts, likedByUser };
    },
    enabled: commentIds.length > 0,
  });
};

// Hook to fetch users who liked a specific comment
export const useCommentLikers = (commentId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["comment-likers", commentId],
    queryFn: async (): Promise<CommentLiker[]> => {
      const { data, error } = await supabase
        .from("comment_likes")
        .select(`
          user_id,
          profiles:user_id (
            id,
            username,
            full_name,
            nickname,
            avatar_url,
            conta_verificada
          )
        `)
        .eq("comment_id", commentId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        user_id: item.user_id,
        username: item.profiles?.username || "",
        full_name: item.profiles?.full_name || null,
        nickname: item.profiles?.nickname || null,
        avatar_url: item.profiles?.avatar_url || null,
        conta_verificada: item.profiles?.conta_verificada || false,
      }));
    },
    enabled: enabled && !!commentId,
  });
};

export const useLikeComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ commentId, isLiked }: { commentId: string; isLiked: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from("comment_likes")
          .insert({ comment_id: commentId, user_id: user.id });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comment-likes"] });
      queryClient.invalidateQueries({ queryKey: ["comment-likers"] });
    },
  });
};
