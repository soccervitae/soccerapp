import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileVisitor {
  id: string;
  visitor_id: string;
  viewed_at: string;
  visitor: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const useProfileVisitors = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile-visitors", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Buscar visitantes únicos (última visita de cada pessoa)
      const { data, error } = await supabase
        .from("profile_views")
        .select(`
          id,
          visitor_id,
          viewed_at,
          visitor:profiles!profile_views_visitor_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("profile_id", user.id)
        .neq("visitor_id", user.id) // Não mostrar próprias visitas
        .order("viewed_at", { ascending: false });

      if (error) throw error;

      // Agrupar por visitor_id mantendo apenas a visita mais recente
      const uniqueVisitors = new Map<string, ProfileVisitor>();
      
      (data || []).forEach((visit: any) => {
        if (!uniqueVisitors.has(visit.visitor_id) && visit.visitor) {
          uniqueVisitors.set(visit.visitor_id, {
            id: visit.id,
            visitor_id: visit.visitor_id,
            viewed_at: visit.viewed_at,
            visitor: visit.visitor
          });
        }
      });

      return Array.from(uniqueVisitors.values());
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useProfileVisitorsCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile-visitors-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from("profile_views")
        .select("visitor_id", { count: "exact", head: true })
        .eq("profile_id", user.id)
        .neq("visitor_id", user.id);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
};
