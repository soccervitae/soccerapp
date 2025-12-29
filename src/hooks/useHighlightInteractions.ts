import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
