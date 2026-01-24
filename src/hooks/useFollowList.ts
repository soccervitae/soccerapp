import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FollowUser {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  conta_verificada: boolean;
}

export const useFollowers = (userId: string) => {
  return useQuery({
    queryKey: ["followers", userId],
    queryFn: async (): Promise<FollowUser[]> => {
      const { data, error } = await supabase
        .from("follows")
        .select(`
          follower:profiles!follows_follower_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            conta_verificada
          )
        `)
        .eq("following_id", userId);

      if (error) throw error;
      
      return (data || [])
        .map((item) => item.follower)
        .filter((f): f is FollowUser => f !== null);
    },
    enabled: !!userId,
  });
};

interface FollowUserWithOfficial extends FollowUser {
  is_official_account?: boolean | null;
}

export const useFollowing = (userId: string) => {
  return useQuery({
    queryKey: ["following", userId],
    queryFn: async (): Promise<FollowUser[]> => {
      const { data, error } = await supabase
        .from("follows")
        .select(`
          following:profiles!follows_following_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            conta_verificada,
            is_official_account
          )
        `)
        .eq("follower_id", userId);

      if (error) throw error;
      
      const users = (data || [])
        .map((item) => item.following as FollowUserWithOfficial | null)
        .filter((f): f is FollowUserWithOfficial => f !== null)
        // Filter out official accounts from messaging/search
        .filter((f) => !f.is_official_account);
      
      // Return without is_official_account field
      return users.map(({ is_official_account, ...rest }) => rest);
    },
    enabled: !!userId,
  });
};
