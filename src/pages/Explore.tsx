import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNavigation } from "@/components/profile/BottomNavigation";
import GuestBanner from "@/components/common/GuestBanner";
import { Search, CheckCircle, Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchProfiles, useFollowingIds, usePopularProfiles } from "@/hooks/useSearchProfiles";
import { useFollowUser } from "@/hooks/useProfile";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ExploreSkeleton } from "@/components/skeletons/ExploreSkeleton";

const positions = ["Todos", "Goleiro", "Lateral", "Zagueiro", "Volante", "Meia", "Atacante"];

const Explore = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("Todos");

  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const isSearchActive = debouncedQuery.trim().length > 0 || selectedPosition !== "Todos";

  const { data: searchResults, isLoading: isSearchLoading } = useSearchProfiles(
    { query: debouncedQuery, position: selectedPosition },
    user?.id
  );

  const { data: popularProfiles, isLoading: isPopularLoading } = usePopularProfiles(user?.id);

  const { data: followingIds } = useFollowingIds(user?.id);
  const { mutate: toggleFollow, isPending: isFollowPending } = useFollowUser();

  const profiles = isSearchActive ? searchResults : popularProfiles;
  const isLoading = isSearchActive ? isSearchLoading : isPopularLoading;

  const handleProfileClick = (username: string) => {
    navigate(`/${username}`);
  };

  const handleFollowClick = (userId: string, isFollowing: boolean) => {
    if (!user) {
      navigate("/login");
      return;
    }
    toggleFollow({ userId, isFollowing });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold text-foreground mb-4">Explorar</h1>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome, username ou time..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
      </header>

      {/* Position Filters */}
      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-2">
          {positions.map((position) => (
            <button
              key={position}
              onClick={() => setSelectedPosition(position)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedPosition === position
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {position}
            </button>
          ))}
        </div>
      </div>

      {/* Section Title */}
      {!isSearchActive && (
        <div className="px-4 pt-2 pb-1 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Sugestões para você</h2>
        </div>
      )}

      {/* Profiles List */}
      <div className="px-4 py-2">
        <div className="flex flex-col gap-2">
          {isLoading ? (
            <ExploreSkeleton />
          ) : profiles && profiles.length > 0 ? (
            profiles.map((profile) => {
              const isFollowing = followingIds?.has(profile.id) || false;

              return (
                <div
                  key={profile.id}
                  className="bg-card border border-border rounded-xl p-3 hover:bg-muted/50 hover:border-primary/30 transition-all group flex items-center gap-3"
                >
                  <div 
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleProfileClick(profile.username)}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                        alt={profile.full_name || profile.username}
                        className="w-11 h-11 rounded-full object-cover border-2 border-border group-hover:border-primary/50 transition-colors"
                      />
                      {profile.conta_verificada && (
                        <CheckCircle className="absolute -bottom-0.5 -right-0.5 w-4 h-4 text-primary fill-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm truncate">
                        {profile.full_name || profile.username}
                      </h3>
                      {profile.position && (
                        <span className="text-xs text-primary font-medium">
                          {profile.position}
                          {profile.team && ` • ${profile.team}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isFollowing ? "outline" : "default"}
                    onClick={() => handleFollowClick(profile.id, isFollowing)}
                    disabled={isFollowPending}
                    className="shrink-0 h-7 px-3 text-xs"
                  >
                    {isFollowPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : isFollowing ? (
                      "Torcendo"
                    ) : (
                      "Torcer"
                    )}
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery || selectedPosition !== "Todos"
                  ? "Nenhum atleta encontrado"
                  : "Comece a buscar atletas"}
              </p>
            </div>
          )}
        </div>
      </div>

      {user ? (
        <BottomNavigation activeTab="search" />
      ) : (
        <GuestBanner />
      )}
    </div>
  );
};

export default Explore;
