import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNavigation } from "@/components/profile/BottomNavigation";
import GuestBanner from "@/components/common/GuestBanner";
import { Search, CheckCircle, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchProfiles, usePopularProfiles } from "@/hooks/useSearchProfiles";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ExploreSkeleton } from "@/components/skeletons/ExploreSkeleton";
import ExploreFiltersSheet, { ExploreFilters } from "@/components/explore/ExploreFiltersSheet";

const Explore = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ExploreFilters>({
    profileType: null,
    gender: null,
    birthYear: null,
    countryId: null,
  });

  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  
  const hasActiveFilters = useMemo(() => {
    return !!(filters.profileType || filters.gender || filters.birthYear || filters.countryId);
  }, [filters]);

  const isSearchActive = debouncedQuery.trim().length > 0 || hasActiveFilters;

  const { data: searchResults, isLoading: isSearchLoading } = useSearchProfiles(
    { 
      query: debouncedQuery,
      profileType: filters.profileType,
      gender: filters.gender,
      birthYear: filters.birthYear,
      countryId: filters.countryId,
    },
    user?.id
  );

  const { data: popularProfiles, isLoading: isPopularLoading, refetch: refetchPopular } = usePopularProfiles(user?.id);

  const profiles = isSearchActive ? searchResults : popularProfiles;
  const isLoading = isSearchActive ? isSearchLoading : isPopularLoading;

  // Listen for explore tab press to refresh
  useEffect(() => {
    const handleExploreTabPressed = () => {
      refetchPopular();
    };
    
    window.addEventListener('explore-tab-pressed', handleExploreTabPressed);
    return () => {
      window.removeEventListener('explore-tab-pressed', handleExploreTabPressed);
    };
  }, []);

  const handleProfileClick = (username: string) => {
    navigate(`/${username}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-foreground">Explorar</h1>
          <ExploreFiltersSheet
            filters={filters}
            onFiltersChange={setFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

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
            profiles.map((profile) => (
              <div
                key={profile.id}
                onClick={() => handleProfileClick(profile.username)}
                className="bg-card border border-border rounded-xl p-3 hover:bg-muted/50 hover:border-primary/30 transition-all group flex items-center gap-3 cursor-pointer"
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
                  {(profile.position_name || profile.team) && (
                    <span className="text-xs text-primary font-medium">
                      {profile.position_name}
                      {profile.position_name && profile.team && ` • `}
                      {profile.team}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "Nenhum atleta encontrado" : "Comece a buscar atletas"}
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
