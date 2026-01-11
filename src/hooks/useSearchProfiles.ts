import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SearchFilters {
  query: string;
  position?: number;
  profileType?: number | null;
  gender?: string | null;
  birthYear?: number | null;
  countryId?: number | null;
}

export interface SearchProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  posicaomas: number | null;
  posicaofem: number | null;
  funcao: number | null;
  position_name?: string | null;
  team: string | null;
  conta_verificada: boolean;
  followers_count?: number;
  role?: string | null;
  gender?: string | null;
}

const fetchPositionNames = async (profiles: SearchProfile[]): Promise<SearchProfile[]> => {
  // Collect all unique position IDs by gender
  const malePositionIds = new Set<number>();
  const femalePositionIds = new Set<number>();
  
  profiles.forEach(p => {
    const isMale = p.gender === 'homem' || p.gender === 'masculino' || p.gender === 'male';
    const isFemale = p.gender === 'mulher' || p.gender === 'feminino' || p.gender === 'female';
    
    if (isMale && p.posicaomas) {
      malePositionIds.add(p.posicaomas);
    } else if (isFemale && p.posicaofem) {
      femalePositionIds.add(p.posicaofem);
    }
  });
  
  if (malePositionIds.size === 0 && femalePositionIds.size === 0) return profiles;

  const positionNameMap = new Map<string, string>();

  // Fetch positions in parallel
  const [malePositions, femalePositions] = await Promise.all([
    malePositionIds.size > 0
      ? supabase.from('posicao_masculina').select('id, name').in('id', Array.from(malePositionIds))
      : { data: [] },
    femalePositionIds.size > 0
      ? supabase.from('posicao_feminina').select('id, name').in('id', Array.from(femalePositionIds))
      : { data: [] },
  ]);
  
  malePositions.data?.forEach(p => {
    positionNameMap.set(`m-${p.id}`, p.name);
  });
  
  femalePositions.data?.forEach(p => {
    positionNameMap.set(`f-${p.id}`, p.name);
  });

  // Map position names to profiles
  return profiles.map(p => {
    const isMale = p.gender === 'homem' || p.gender === 'masculino' || p.gender === 'male';
    const isFemale = p.gender === 'mulher' || p.gender === 'feminino' || p.gender === 'female';
    
    let positionName: string | null = null;
    if (isMale && p.posicaomas) {
      positionName = positionNameMap.get(`m-${p.posicaomas}`) || null;
    } else if (isFemale && p.posicaofem) {
      positionName = positionNameMap.get(`f-${p.posicaofem}`) || null;
    }
    
    return {
      ...p,
      position_name: positionName
    };
  });
};

export const useSearchProfiles = (filters: SearchFilters, currentUserId?: string) => {
  return useQuery({
    queryKey: ["search-profiles", filters, currentUserId],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, posicaomas, posicaofem, funcao, team, conta_verificada, role, gender, birth_date, nationality")
        .eq("profile_completed", true)
        .not("avatar_url", "is", null)
        .neq("avatar_url", "")
        .neq("is_official_account", true)
        .order("full_name");

      // Search by name or username
      if (filters.query && filters.query.trim()) {
        query = query.or(
          `full_name.ilike.%${filters.query}%,username.ilike.%${filters.query}%`
        );
      }

      // Position filter (numeric ID) - filter by posicaomas or posicaofem
      if (filters.position) {
        query = query.or(`posicaomas.eq.${filters.position},posicaofem.eq.${filters.position}`);
      }

      // Profile type filter (funcaoperfil)
      if (filters.profileType) {
        // funcao references funcaoperfil for the profile type
        query = query.eq("funcao", filters.profileType);
      }

      // Gender filter
      if (filters.gender) {
        query = query.eq("gender", filters.gender);
      }

      // Country filter
      if (filters.countryId) {
        query = query.eq("nationality", filters.countryId);
      }

      // Exclude current user
      if (currentUserId) {
        query = query.neq("id", currentUserId);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      
      let profiles = (data || []) as SearchProfile[];

      // Birth year filter (client-side since we need to extract year from date)
      if (filters.birthYear) {
        profiles = profiles.filter((p: any) => {
          if (!p.birth_date) return false;
          const year = new Date(p.birth_date).getFullYear();
          return year === filters.birthYear;
        });
      }

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
        .select("id, username, full_name, avatar_url, posicaomas, posicaofem, funcao, team, conta_verificada, role, gender")
        .eq("profile_completed", true)
        .not("avatar_url", "is", null)
        .neq("avatar_url", "")
        .neq("id", currentUserId || "")
        .neq("is_official_account", true)
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
      })) as SearchProfile[];

      // Sort: verified first, then by followers
      const sorted = profilesWithCount.sort((a, b) => {
        if (a.conta_verificada !== b.conta_verificada) {
          return a.conta_verificada ? -1 : 1;
        }
        return b.followers_count - a.followers_count;
      });

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
