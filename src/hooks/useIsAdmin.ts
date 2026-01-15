import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useIsAdmin() {
  const { user } = useAuth();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      // Check for admin role
      const { data: adminRole, error: adminError } = await supabase
        .rpc("has_role", { _user_id: user.id, _role: "admin" });
      
      if (adminError) {
        console.error("Error checking admin role:", adminError);
        return false;
      }
      
      if (adminRole) return true;
      
      // Check for oficial role (also has admin access)
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      const hasOficialRole = userRoles?.some(
        (r) => r.role === ("oficial" as typeof r.role)
      ) ?? false;
      
      return hasOficialRole;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return { isAdmin: isAdmin ?? false, isLoading };
}
