import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FollowUser {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  conta_verificada: boolean;
  is_verified_premium?: boolean | null;
  verified_premium_expires_at?: string | null;
  is_official_account?: boolean | null;
  is_identity_verified?: boolean | null;
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
            conta_verificada,
            is_verified_premium,
            verified_premium_expires_at,
            is_official_account,
            is_identity_verified
          )
        `)
        .eq("following_id", userId);

      if (error) throw error;
      
      return (data || [])
        .map((item) => item.follower as FollowUser | null)
        .filter((f): f is FollowUser => f !== null);
    },
    enabled: !!userId,
  });
};

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
            is_verified_premium,
            verified_premium_expires_at,
            is_official_account,
            is_identity_verified
          )
        `)
        .eq("follower_id", userId);

      if (error) throw error;
      
      return (data || [])
        .map((item) => item.following as FollowUser | null)
        .filter((f): f is FollowUser => f !== null)
        
    },
    enabled: !!userId,
  });
};
