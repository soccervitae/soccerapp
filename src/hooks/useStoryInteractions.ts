import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface StoryViewer {
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

interface StoryReply {
  id: string;
  story_id: string;
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

// Get viewers for a story (only owner can see)
export const useStoryViewers = (storyId: string | undefined) => {
  return useQuery({
    queryKey: ["story-viewers", storyId],
    queryFn: async (): Promise<StoryViewer[]> => {
      if (!storyId) return [];

      const { data, error } = await supabase
        .from("story_views")
        .select(`
          id,
          viewer_id,
          viewed_at,
          profile:profiles!story_views_viewer_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("story_id", storyId)
        .order("viewed_at", { ascending: false });

      if (error) throw error;
      return data as unknown as StoryViewer[];
    },
    enabled: !!storyId,
  });
};

// Get replies for a story (only owner can see)
export const useStoryReplies = (storyId: string | undefined) => {
  return useQuery({
    queryKey: ["story-replies", storyId],
    queryFn: async (): Promise<StoryReply[]> => {
      if (!storyId) return [];

      const { data, error } = await supabase
        .from("story_replies")
        .select(`
          id,
          story_id,
          sender_id,
          content,
          created_at,
          profile:profiles!story_replies_sender_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("story_id", storyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as StoryReply[];
    },
    enabled: !!storyId,
  });
};

// Send a reply to a story
export const useSendStoryReply = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storyId, content }: { storyId: string; content: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("story_replies")
        .insert({
          story_id: storyId,
          sender_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["story-replies", variables.storyId] });
      toast.success("Mensagem enviada!");
    },
    onError: () => {
      toast.error("Erro ao enviar mensagem");
    },
  });
};

// Check if current user liked a story
export const useStoryLikeStatus = (storyId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["story-like-status", storyId, user?.id],
    queryFn: async (): Promise<boolean> => {
      if (!storyId || !user) return false;

      const { data, error } = await supabase
        .from("story_likes")
        .select("id")
        .eq("story_id", storyId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!storyId && !!user,
  });
};

// Get viewer count for a story
export const useStoryViewerCount = (storyId: string | undefined) => {
  return useQuery({
    queryKey: ["story-viewer-count", storyId],
    queryFn: async (): Promise<number> => {
      if (!storyId) return 0;

      const { count, error } = await supabase
        .from("story_views")
        .select("*", { count: "exact", head: true })
        .eq("story_id", storyId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!storyId,
  });
};

// Get reply count for a story
export const useStoryReplyCount = (storyId: string | undefined) => {
  return useQuery({
    queryKey: ["story-reply-count", storyId],
    queryFn: async (): Promise<number> => {
      if (!storyId) return 0;

      const { count, error } = await supabase
        .from("story_replies")
        .select("*", { count: "exact", head: true })
        .eq("story_id", storyId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!storyId,
  });
};
