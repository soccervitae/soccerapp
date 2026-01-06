import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SavedHighlight {
  id: string;
  user_id: string;
  highlight_id: string;
  created_at: string;
  highlight: {
    id: string;
    title: string;
    image_url: string;
    user_id: string;
    created_at: string | null;
    display_order: number | null;
    views_seen_at: string | null;
    images: {
      id: string;
      image_url: string;
      media_type: string | null;
      display_order: number | null;
    }[];
    profile: {
      id: string;
      username: string;
      full_name: string | null;
      nickname: string | null;
      avatar_url: string | null;
      conta_verificada: boolean;
    };
  };
}

export function useSavedHighlights(userId: string | undefined) {
  return useQuery({
    queryKey: ["saved-highlights", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("saved_highlights")
        .select(`
          id,
          user_id,
          highlight_id,
          created_at,
          highlight:user_highlights!inner (
            id,
            title,
            image_url,
            user_id,
            created_at,
            display_order,
            views_seen_at,
            images:highlight_images (
              id,
              image_url,
              media_type,
              display_order
            ),
            profile:profiles!user_highlights_user_id_fkey (
              id,
              username,
              full_name,
              nickname,
              avatar_url,
              conta_verificada
            )
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface
      return (data || []).map((item: any) => ({
        ...item,
        highlight: {
          ...item.highlight,
          profile: Array.isArray(item.highlight.profile) 
            ? item.highlight.profile[0] 
            : item.highlight.profile,
          images: item.highlight.images || []
        }
      })) as SavedHighlight[];
    },
    enabled: !!userId,
  });
}

export function useHighlightSaveStatus(highlightId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["highlight-save-status", highlightId, user?.id],
    queryFn: async () => {
      if (!highlightId || !user?.id) return false;

      const { data, error } = await supabase
        .from("saved_highlights")
        .select("id")
        .eq("highlight_id", highlightId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!highlightId && !!user?.id,
  });
}

export function useToggleSaveHighlight() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ highlightId, isSaved }: { highlightId: string; isSaved: boolean }) => {
      if (!user?.id) throw new Error("User not authenticated");

      if (isSaved) {
        // Unsave
        const { error } = await supabase
          .from("saved_highlights")
          .delete()
          .eq("highlight_id", highlightId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Save
        const { error } = await supabase
          .from("saved_highlights")
          .insert({
            highlight_id: highlightId,
            user_id: user.id,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, { highlightId }) => {
      queryClient.invalidateQueries({ queryKey: ["highlight-save-status", highlightId] });
      queryClient.invalidateQueries({ queryKey: ["saved-highlights"] });
    },
  });
}
