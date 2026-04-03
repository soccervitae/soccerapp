import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNavigation } from "@/components/profile/BottomNavigation";
import GuestBanner from "@/components/common/GuestBanner";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Search, CheckCircle, TrendingUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchProfiles, usePopularProfiles } from "@/hooks/useSearchProfiles";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ExploreSkeleton } from "@/components/skeletons/ExploreSkeleton";
import ExploreFiltersSheet, { ExploreFilters } from "@/components/explore/ExploreFiltersSheet";

const Explore = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ExploreFilters>({
    profileType: null,
    gender: null,
    birthYear: null,
    countryId: null,
    position: null,
  });

  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  
  const hasActiveFilters = useMemo(() => {
    return !!(filters.profileType || filters.gender || filters.birthYear || filters.countryId || filters.position);
  }, [filters]);

  const isSearchActive = debouncedQuery.trim().length > 0 || hasActiveFilters;

  const { data: searchResults, isLoading: isSearchLoading } = useSearchProfiles(
    { 
      query: debouncedQuery,
      profileType: filters.profileType,
      gender: filters.gender,
      birthYear: filters.birthYear,
      countryId: filters.countryId,
      position: filters.position,
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

  const exploreContent = (
    <>
      {/* Search Bar */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
      </div>

      {/* Section Title */}
      {!isSearchActive && (
        <div className="px-4 pb-1 flex items-center gap-2">
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
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate flex items-center gap-1">
                    {profile.full_name || profile.username}
                    {profile.is_verified_premium && (!profile.verified_premium_expires_at || new Date(profile.verified_premium_expires_at) > new Date()) && (
                      <span className="material-symbols-outlined text-[14px] text-primary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    )}
                  </h3>
                  {profile.account_type === 'time' ? (
                    <span className="text-xs text-muted-foreground">
                      Time de Futebol
                    </span>
                  ) : (profile.position_name || profile.team) ? (
                    <span className="text-xs text-primary font-medium">
                      {profile.position_name}
                      {profile.position_name && profile.team && ` • `}
                      {profile.team}
                    </span>
                  ) : null}
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
    </>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 h-[50px] flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Explorar</h1>
          <div className="flex items-center gap-2">
            <ExploreFiltersSheet
              filters={filters}
              onFiltersChange={setFilters}
              hasActiveFilters={hasActiveFilters}
            />
            <NotificationBell />
          </div>
        </div>

        <div className="pt-[50px]">
          {exploreContent}
        </div>

        {user ? (
          <BottomNavigation activeTab="search" />
        ) : (
          <GuestBanner />
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-muted/30">
      <DesktopHeader />
      <div className="flex pt-14 max-w-screen-2xl mx-auto">
        <DesktopSidebar />
        <main className="flex-1 min-w-0 px-4 py-4 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-foreground">Explorar</h1>
              <ExploreFiltersSheet
                filters={filters}
                onFiltersChange={setFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
            {exploreContent}
          </div>
        </main>
        <RightSidebar />
      </div>
    </div>
  );
};

export default Explore;
