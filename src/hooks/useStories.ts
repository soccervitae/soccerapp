import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  duration: number;
  created_at: string;
  expires_at: string;
  profile: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface GroupedStories {
  userId: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  stories: Story[];
  hasNewStory: boolean;
}

export const useStories = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["stories"],
    queryFn: async (): Promise<GroupedStories[]> => {
      const { data: stories, error } = await supabase
        .from("stories")
        .select(`
          *,
          profile:profiles!stories_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get viewed stories for current user
      let viewedStoryIds = new Set<string>();
      if (user) {
        const { data: views } = await supabase
          .from("story_views")
          .select("story_id")
          .eq("viewer_id", user.id);
        viewedStoryIds = new Set(views?.map(v => v.story_id) || []);
      }

      // Group stories by user
      const groupedMap = new Map<string, GroupedStories>();
      
      stories?.forEach(story => {
        const userId = story.user_id;
        if (!groupedMap.has(userId)) {
          groupedMap.set(userId, {
            userId,
            username: story.profile.username,
            fullName: story.profile.full_name,
            avatarUrl: story.profile.avatar_url,
            stories: [],
            hasNewStory: false,
          });
        }
        
        const group = groupedMap.get(userId)!;
        group.stories.push(story);
        if (!viewedStoryIds.has(story.id)) {
          group.hasNewStory = true;
        }
      });

      return Array.from(groupedMap.values());
    },
  });
};

export const useCreateStory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ mediaUrl, mediaType, duration = 5 }: { mediaUrl: string; mediaType: string; duration?: number }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("stories")
        .insert({
          user_id: user.id,
          media_url: mediaUrl,
          media_type: mediaType,
          duration,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast.success("Replay publicado!");
    },
    onError: () => {
      toast.error("Erro ao publicar replay");
    },
  });
};

export const useViewStory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (storyId: string) => {
      if (!user) return;

      // Check if already viewed
      const { data: existing } = await supabase
        .from("story_views")
        .select("id")
        .eq("story_id", storyId)
        .eq("viewer_id", user.id)
        .single();

      if (existing) return;

      const { error } = await supabase
        .from("story_views")
        .insert({
          story_id: storyId,
          viewer_id: user.id,
        });

      if (error && error.code !== "23505") throw error; // Ignore duplicate key error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
};

export const useLikeStory = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ storyId, isLiked }: { storyId: string; isLiked: boolean }) => {
      if (!user) throw new Error("Usuário não autenticado");

      if (isLiked) {
        const { error } = await supabase
          .from("story_likes")
          .delete()
          .eq("story_id", storyId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("story_likes")
          .insert({ story_id: storyId, user_id: user.id });
        if (error) throw error;
      }
    },
  });
};
