import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SearchFilters {
  query: string;
  position?: number;
}

export interface SearchProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  position: number | null;
  position_name?: string | null;
  team: string | null;
  conta_verificada: boolean;
  followers_count?: number;
  role?: string | null;
  gender?: string | null;
}

const fetchPositionNames = async (profiles: SearchProfile[]): Promise<SearchProfile[]> => {
  // Filter only athletes (role is null, 'atleta', or empty string means athlete)
  const athleteProfiles = profiles.filter(p => 
    p.position && (!p.role || p.role === 'atleta' || p.role === '')
  );
  
  if (athleteProfiles.length === 0) return profiles;

  // Group by gender to fetch from correct tables
  const maleIds = athleteProfiles
    .filter(p => p.gender === 'masculino')
    .map(p => p.position!)
    .filter((v, i, a) => a.indexOf(v) === i);
  
  const femaleIds = athleteProfiles
    .filter(p => p.gender === 'feminino')
    .map(p => p.position!)
    .filter((v, i, a) => a.indexOf(v) === i);

  const positionNameMap = new Map<string, string>();

  // Fetch male positions
  if (maleIds.length > 0) {
    const { data: malePositions } = await supabase
      .from('posicao_masculina')
      .select('id, name')
      .in('id', maleIds);
    
    malePositions?.forEach(p => {
      positionNameMap.set(`masculino-${p.id}`, p.name);
    });
  }

  // Fetch female positions
  if (femaleIds.length > 0) {
    const { data: femalePositions } = await supabase
      .from('posicao_feminina')
      .select('id, name')
      .in('id', femaleIds);
    
    femalePositions?.forEach(p => {
      positionNameMap.set(`feminino-${p.id}`, p.name);
    });
  }

  // Map position names to profiles
  return profiles.map(p => {
    if (!p.position || (p.role && p.role !== 'atleta' && p.role !== '')) {
      return p;
    }
    const key = `${p.gender || 'masculino'}-${p.position}`;
    return {
      ...p,
      position_name: positionNameMap.get(key) || null
    };
  });
};

export const useSearchProfiles = (filters: SearchFilters, currentUserId?: string) => {
  return useQuery({
    queryKey: ["search-profiles", filters, currentUserId],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, position, team, conta_verificada, role, gender")
        .eq("profile_completed", true)
        .order("full_name");

      // Search by name or username
      if (filters.query && filters.query.trim()) {
        query = query.or(
          `full_name.ilike.%${filters.query}%,username.ilike.%${filters.query}%`
        );
      }

      // Position filter (numeric ID)
      if (filters.position) {
        query = query.eq("position", filters.position);
      }

      // Exclude current user
      if (currentUserId) {
        query = query.neq("id", currentUserId);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      
      const profiles = (data as SearchProfile[]) || [];
      return fetchPositionNames(profiles);
    },
  });
};

export const usePopularProfiles = (currentUserId?: string) => {
  return useQuery({
    queryKey: ["popular-profiles", currentUserId],
    queryFn: async () => {
      // Fetch verified profiles first
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, position, team, conta_verificada, role, gender")
        .eq("profile_completed", true)
        .neq("id", currentUserId || "")
        .order("conta_verificada", { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!profiles || profiles.length === 0) return [];

      // Fetch follower counts
      const profileIds = profiles.map(p => p.id);
      const { data: followCounts } = await supabase
        .from("follows")
        .select("following_id")
        .in("following_id", profileIds);

      // Count followers per profile
      const followerCountMap = new Map<string, number>();
      followCounts?.forEach(f => {
        const count = followerCountMap.get(f.following_id) || 0;
        followerCountMap.set(f.following_id, count + 1);
      });

      // Add count and sort by popularity
      const profilesWithCount = profiles.map(p => ({
        ...p,
        followers_count: followerCountMap.get(p.id) || 0,
      }));

      // Sort: verified first, then by followers
      const sorted = profilesWithCount.sort((a, b) => {
        if (a.conta_verificada !== b.conta_verificada) {
          return a.conta_verificada ? -1 : 1;
        }
        return b.followers_count - a.followers_count;
      }) as SearchProfile[];

      return fetchPositionNames(sorted);
    },
  });
};

export const useFollowingIds = (userId?: string) => {
  return useQuery({
    queryKey: ["following-ids", userId],
    queryFn: async () => {
      if (!userId) return new Set<string>();
      
      const { data, error } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId);
      
      if (error) throw error;
      return new Set(data?.map(f => f.following_id) || []);
    },
    enabled: !!userId,
  });
};
