import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useFollowUser } from "@/hooks/useProfile";
import { Skeleton } from "@/components/ui/skeleton";

const trendingTopics = [
  { tag: "#CopaLibertadores2025", posts: "12.4k" },
  { tag: "#Brasileirão", posts: "8.2k" },
  { tag: "#TreinoDeHoje", posts: "5.1k" },
  { tag: "#FutebolFeminino", posts: "3.8k" },
  { tag: "#BaseDaBase", posts: "2.5k" },
];

export const RightSidebar = () => {
  const { user } = useAuth();
  const followUser = useFollowUser();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["profile-suggestions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get profiles the user doesn't follow yet
      const { data: following } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = following?.map((f) => f.following_id) || [];
      followingIds.push(user.id); // Exclude self

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, position, team")
        .not("id", "in", `(${followingIds.join(",")})`)
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFollow = (userId: string) => {
    followUser.mutate({ userId, isFollowing: false });
  };

  return (
    <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-80 flex-shrink-0 overflow-y-auto p-4 hidden xl:block">
      {/* Suggestions */}
      <div className="rounded-xl bg-card border border-border p-4 mb-4">
        <h3 className="font-semibold text-foreground mb-4">Sugestões para você</h3>
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))
          ) : suggestions && suggestions.length > 0 ? (
            suggestions.map((profile) => (
              <div key={profile.id} className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {getInitials(profile.full_name || profile.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">
                    {profile.full_name || profile.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {profile.position || "Atleta"} {profile.team && `• ${profile.team}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={() => handleFollow(profile.id)}
                  disabled={followUser.isPending}
                >
                  Seguir
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma sugestão disponível
            </p>
          )}
        </div>
      </div>

      {/* Trending */}
      <div className="rounded-xl bg-card border border-border p-4">
        <h3 className="font-semibold text-foreground mb-4">Trending no Futebol</h3>
        <div className="space-y-3">
          {trendingTopics.map((topic) => (
            <button
              key={topic.tag}
              className="w-full text-left hover:bg-muted rounded-lg p-2 -mx-2 transition-colors"
            >
              <p className="font-medium text-primary text-sm">{topic.tag}</p>
              <p className="text-xs text-muted-foreground">{topic.posts} posts</p>
            </button>
          ))}
        </div>
      </div>

      {/* Footer Links */}
      <div className="mt-4 px-2">
        <p className="text-xs text-muted-foreground">
          Sobre • Ajuda • Privacidade • Termos
        </p>
        <p className="text-xs text-muted-foreground mt-1">© 2025 Soccer Vitae</p>
      </div>
    </aside>
  );
};
