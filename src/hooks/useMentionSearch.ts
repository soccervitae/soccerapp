import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MentionUser {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  conta_verificada: boolean;
}

export const useMentionSearch = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["mention-search", query],
    queryFn: async (): Promise<MentionUser[]> => {
      if (!query || query.length < 1) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, conta_verificada")
        .or(`username.ilike.${query}%,full_name.ilike.%${query}%`)
        .limit(8);

      if (error) throw error;
      return data || [];
    },
    enabled: enabled && query.length >= 1,
    staleTime: 30000,
  });
};
