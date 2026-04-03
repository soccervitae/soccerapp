import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsPageLayout } from "@/components/layout/SettingsPageLayout";

export default function Favorites() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: favorites, isLoading } = useQuery({
    queryKey: ["favorite_profiles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("favorite_profiles")
        .select("*, profiles!favorite_profiles_favorite_id_fkey(id, username, full_name, avatar_url, account_type)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 h-[50px] flex items-center">
        <button
          onClick={() => navigate("/settings")}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-foreground transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h1 className="text-base font-bold text-foreground ml-2">Favoritos</h1>
      </header>

      <div className="pt-[50px] pb-20">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : !favorites?.length ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <span className="material-symbols-outlined text-[48px] text-muted-foreground mb-3">star</span>
            <p className="text-muted-foreground font-medium">Nenhum perfil favoritado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Favorite perfis para encontrá-los rapidamente aqui
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-1">
            {favorites.map((fav: any) => {
              const p = fav.profiles;
              if (!p) return null;
              return (
                <button
                  key={fav.id}
                  onClick={() => navigate(`/profile/${p.username}`)}
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={p.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(p.full_name || p.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-foreground text-sm">{p.full_name || p.username}</p>
                    <p className="text-xs text-muted-foreground">@{p.username}</p>
                  </div>
                  <span className="material-symbols-outlined text-muted-foreground text-[20px]">chevron_right</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
