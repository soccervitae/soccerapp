import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ScheduledPost {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  scheduled_at: string;
  is_published: boolean;
  created_at: string;
  location_name: string | null;
  music_track_id: string | null;
  profile?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export const useScheduledPosts = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ["scheduled-posts", targetUserId],
    queryFn: async (): Promise<ScheduledPost[]> => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from("posts")
        .select(`
          id,
          user_id,
          content,
          media_url,
          media_type,
          scheduled_at,
          is_published,
          created_at,
          location_name,
          music_track_id,
          profile:profiles!posts_user_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .eq("user_id", targetUserId)
        .eq("is_published", false)
        .not("scheduled_at", "is", null)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      return data as ScheduledPost[];
    },
    enabled: !!targetUserId,
  });
};

export const useUpdateScheduledPost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      postId,
      scheduledAt,
    }: {
      postId: string;
      scheduledAt: Date;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("posts")
        .update({
          scheduled_at: scheduledAt.toISOString(),
        })
        .eq("id", postId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast.success("Agendamento atualizado!");
    },
    onError: (error) => {
      console.error("Error updating scheduled post:", error);
      toast.error("Erro ao atualizar agendamento");
    },
  });
};

export const usePublishNow = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("posts")
        .update({
          is_published: true,
          published_at: new Date().toISOString(),
          scheduled_at: null,
        })
        .eq("id", postId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post publicado!");
    },
    onError: (error) => {
      console.error("Error publishing post:", error);
      toast.error("Erro ao publicar post");
    },
  });
};

export const useCancelScheduledPost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user.id)
        .eq("is_published", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast.success("Post agendado removido!");
    },
    onError: (error) => {
      console.error("Error canceling scheduled post:", error);
      toast.error("Erro ao remover post agendado");
    },
  });
};
