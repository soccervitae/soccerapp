import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserHighlight } from "@/hooks/useProfile";
import { toast } from "sonner";

interface HighlightViewer {
  id: string;
  viewer_id: string;
  viewed_at: string;
  profile: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface HighlightReply {
  id: string;
  highlight_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profile: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Get viewers for a highlight (only owner can see)
export const useHighlightViewers = (highlightId: string | undefined) => {
  return useQuery({
    queryKey: ["highlight-viewers", highlightId],
    queryFn: async (): Promise<HighlightViewer[]> => {
      if (!highlightId) return [];

      const { data, error } = await supabase
        .from("highlight_views")
        .select(`
          id,
          viewer_id,
          viewed_at,
          profile:profiles!highlight_views_viewer_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("highlight_id", highlightId)
        .order("viewed_at", { ascending: false });

      if (error) throw error;
      return data as unknown as HighlightViewer[];
    },
    enabled: !!highlightId,
  });
};

// Get viewer count for a highlight
export const useHighlightViewerCount = (highlightId: string | undefined) => {
  return useQuery({
    queryKey: ["highlight-viewer-count", highlightId],
    queryFn: async (): Promise<number> => {
      if (!highlightId) return 0;

      const { count, error } = await supabase
        .from("highlight_views")
        .select("*", { count: "exact", head: true })
        .eq("highlight_id", highlightId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!highlightId,
  });
};

// Mark highlight as viewed
export const useMarkHighlightViewed = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (highlightId: string) => {
      if (!user) return;

      const { error } = await supabase
        .from("highlight_views")
        .upsert(
          {
            highlight_id: highlightId,
            viewer_id: user.id,
          },
          { onConflict: "highlight_id,viewer_id" }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["highlight-viewers"] });
      queryClient.invalidateQueries({ queryKey: ["highlight-viewer-count"] });
    },
  });
};

// Check if highlight has new views (views after views_seen_at)
export const useHighlightsNewViews = (highlights: UserHighlight[], isOwnProfile: boolean) => {
  return useQuery({
    queryKey: ["highlights-new-views", highlights.map(h => h.id).join(",")],
    queryFn: async (): Promise<Record<string, boolean>> => {
      const result: Record<string, boolean> = {};
      
      for (const highlight of highlights) {
        let query = supabase
          .from("highlight_views")
          .select("id", { count: "exact", head: true })
          .eq("highlight_id", highlight.id);

        // If owner has seen views before, check for newer ones
        if (highlight.views_seen_at) {
          query = query.gt("viewed_at", highlight.views_seen_at);
        }

        const { count } = await query;
        result[highlight.id] = (count || 0) > 0;
      }
      
      return result;
    },
    enabled: highlights.length > 0 && isOwnProfile,
  });
};

// Mark views as seen (when owner opens the viewers sheet)
export const useMarkViewsSeen = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (highlightId: string) => {
      const { error } = await supabase
        .from("user_highlights")
        .update({ views_seen_at: new Date().toISOString() })
        .eq("id", highlightId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["highlights-new-views"] });
      queryClient.invalidateQueries({ queryKey: ["user-highlights"] });
    },
  });
};

// ==================== LIKES ====================

// Check if current user liked a highlight
export const useHighlightLikeStatus = (highlightId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["highlight-like-status", highlightId, user?.id],
    queryFn: async (): Promise<boolean> => {
      if (!highlightId || !user) return false;

      const { data, error } = await supabase
        .from("highlight_likes")
        .select("id")
        .eq("highlight_id", highlightId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!highlightId && !!user,
  });
};

// Toggle like on a highlight
export const useToggleHighlightLike = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ highlightId, isLiked }: { highlightId: string; isLiked: boolean }) => {
      if (!user) throw new Error("Usuário não autenticado");

      if (isLiked) {
        const { error } = await supabase
          .from("highlight_likes")
          .delete()
          .eq("highlight_id", highlightId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("highlight_likes")
          .insert({ highlight_id: highlightId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["highlight-like-status", variables.highlightId] });
      queryClient.invalidateQueries({ queryKey: ["highlight-like-count", variables.highlightId] });
    },
  });
};

// Get like count for a highlight
export const useHighlightLikeCount = (highlightId: string | undefined) => {
  return useQuery({
    queryKey: ["highlight-like-count", highlightId],
    queryFn: async (): Promise<number> => {
      if (!highlightId) return 0;

      const { count, error } = await supabase
        .from("highlight_likes")
        .select("*", { count: "exact", head: true })
        .eq("highlight_id", highlightId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!highlightId,
  });
};

// ==================== REPLIES ====================

// Get replies for a highlight (only owner can see)
export const useHighlightReplies = (highlightId: string | undefined) => {
  return useQuery({
    queryKey: ["highlight-replies", highlightId],
    queryFn: async (): Promise<HighlightReply[]> => {
      if (!highlightId) return [];

      const { data, error } = await supabase
        .from("highlight_replies")
        .select(`
          id,
          highlight_id,
          sender_id,
          content,
          created_at,
          profile:profiles!highlight_replies_sender_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("highlight_id", highlightId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as HighlightReply[];
    },
    enabled: !!highlightId,
  });
};

// Send a reply to a highlight
export const useSendHighlightReply = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ highlightId, content }: { highlightId: string; content: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("highlight_replies")
        .insert({
          highlight_id: highlightId,
          sender_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["highlight-replies", variables.highlightId] });
      queryClient.invalidateQueries({ queryKey: ["highlight-reply-count", variables.highlightId] });
      toast.success("Mensagem enviada!");
    },
    onError: () => {
      toast.error("Erro ao enviar mensagem");
    },
  });
};

// Get reply count for a highlight
export const useHighlightReplyCount = (highlightId: string | undefined) => {
  return useQuery({
    queryKey: ["highlight-reply-count", highlightId],
    queryFn: async (): Promise<number> => {
      if (!highlightId) return 0;

      const { count, error } = await supabase
        .from("highlight_replies")
        .select("*", { count: "exact", head: true })
        .eq("highlight_id", highlightId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!highlightId,
  });
};
