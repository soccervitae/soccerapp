import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { HighlightsSection } from "@/components/profile/HighlightsSection";
import { ChampionshipsTab } from "@/components/profile/ChampionshipsTab";
import { AchievementsTab } from "@/components/profile/AchievementsTab";
import { BottomNavigation } from "@/components/profile/BottomNavigation";
import { useUserChampionships, useUserAchievements, useUserPosts } from "@/hooks/useProfile";
import GuestBanner from "@/components/common/GuestBanner";
import { RefreshableContainer } from "@/components/common/RefreshableContainer";
import { useParams, useLocation } from "react-router-dom";
import { 
  useProfile, 
  useProfileByUsername,
  useFollowStats, 
  useProfileView,
  useUserHighlights,
} from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Profile = () => {
  const { username } = useParams<{ username?: string }>();
  const { user } = useAuth();
  const location = useLocation();
  
  // Check if coming from onboarding
  const [fromOnboarding, setFromOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  useEffect(() => {
    // Check if navigated from welcome page (onboarding)
    if (location.state?.fromOnboarding) {
      setFromOnboarding(true);
    }
  }, [location.state]);
  
  // If username in URL, fetch by username; otherwise show current user's profile
  const { data: profileByUsername, isLoading: usernameLoading, isFetching: usernameFetching, refetch: refetchProfileByUsername } = useProfileByUsername(username || "");
  const { data: profileById, isLoading: idLoading, isFetching: idFetching, refetch: refetchProfileById } = useProfile(!username ? user?.id : undefined);
  
  // Use the appropriate profile based on route
  const profile = username ? profileByUsername : profileById;
  const profileLoading = username ? usernameLoading : idLoading;
  const targetUserId = profile?.id;
  
  const { data: followStats, isLoading: statsLoading, isFetching: statsFetching, refetch: refetchStats } = useFollowStats(targetUserId);
  const { data: highlights, isLoading: highlightsLoading } = useUserHighlights(targetUserId);
  const { data: championships, isLoading: championshipsLoading } = useUserChampionships(targetUserId);
  const { data: achievements, isLoading: achievementsLoading } = useUserAchievements(targetUserId);
  const { data: userPosts, isLoading: postsLoading } = useUserPosts(targetUserId);

  // Filter posts by type
  const photoPosts = userPosts?.filter(post => 
    post.media_type === 'image' || post.media_type === 'carousel'
  ) || [];
  const videoPosts = userPosts?.filter(post => post.media_type === 'video') || [];
  const profileView = useProfileView();

  const isOwnProfile = user?.id === targetUserId;

  // Record profile view
  useEffect(() => {
    if (targetUserId && user && targetUserId !== user.id) {
      profileView.mutate(targetUserId);
    }
  }, [targetUserId, user?.id]);

  const isLoading = profileLoading || statsLoading;
  
  // Refetching state for overlay
  const profileFetching = username ? usernameFetching : idFetching;
  const isRefetching = (profileFetching || statsFetching) && !isLoading;

  const handleRefresh = async () => {
    const refetchProfile = username ? refetchProfileByUsername : refetchProfileById;
    await Promise.all([
      refetchProfile(),
      refetchStats(),
    ]);
  };

  // Listen for profile tab press to refresh
  useEffect(() => {
    const handleProfileTabPressed = () => {
      handleRefresh();
    };
    
    window.addEventListener('profile-tab-pressed', handleProfileTabPressed);
    return () => {
      window.removeEventListener('profile-tab-pressed', handleProfileTabPressed);
    };
  }, []);

  if (isLoading) {
    return (
      <main className="bg-background min-h-screen relative pb-24">
        <div className="pt-16">
          <ProfileSkeleton />
        </div>
        <BottomNavigation activeTab="profile" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="bg-background min-h-screen relative pb-24 flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-[64px] text-muted-foreground">person_off</span>
          <p className="text-muted-foreground mt-2">Perfil não encontrado</p>
        </div>
        <BottomNavigation activeTab="profile" />
      </main>
    );
  }

  // Animation variants for onboarding entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  // Render media grid
  const renderMediaGrid = (posts: typeof userPosts, emptyMessage: string, emptyIcon: string) => {
    if (postsLoading) {
      return (
        <div className="grid grid-cols-3 gap-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse rounded-sm" />
          ))}
        </div>
      );
    }

    if (!posts || posts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <span className="material-symbols-outlined text-[48px] mb-2">{emptyIcon}</span>
          <p className="text-sm">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-1">
        {posts.map((post) => {
          const mediaUrls = post.media_url?.split(',') || [];
          const firstMedia = mediaUrls[0];
          const isVideo = post.media_type === 'video';
          const isCarousel = post.media_type === 'carousel' && mediaUrls.length > 1;

          return (
            <div key={post.id} className="aspect-square relative overflow-hidden rounded-sm bg-muted">
              {isVideo ? (
                <video
                  src={firstMedia}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={firstMedia}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
              {isVideo && (
                <div className="absolute top-2 right-2">
                  <span className="material-symbols-outlined text-white text-[18px] drop-shadow-lg">play_circle</span>
                </div>
              )}
              {isCarousel && (
                <div className="absolute top-2 right-2">
                  <span className="material-symbols-outlined text-white text-[18px] drop-shadow-lg">photo_library</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Profile tabs component
  const ProfileTabs = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
      <TabsList className="w-full h-10 bg-muted p-1 rounded-md grid grid-cols-5">
        <TabsTrigger 
          value="profile" 
          className="gap-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">person</span>
          Perfil
        </TabsTrigger>
        <TabsTrigger 
          value="photos" 
          className="gap-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">photo_library</span>
          Fotos
        </TabsTrigger>
        <TabsTrigger 
          value="videos" 
          className="gap-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">play_circle</span>
          Vídeos
        </TabsTrigger>
        <TabsTrigger 
          value="championships" 
          className="gap-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">sports_soccer</span>
          Camp.
        </TabsTrigger>
        <TabsTrigger 
          value="achievements" 
          className="gap-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">trophy</span>
          Conq.
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-4 px-4">
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <span className="material-symbols-outlined text-[48px] mb-2">info</span>
          <p className="text-sm">Informações do perfil</p>
        </div>
      </TabsContent>

      <TabsContent value="photos" className="mt-4 px-1">
        {renderMediaGrid(photoPosts, "Nenhuma foto ainda", "photo_library")}
      </TabsContent>

      <TabsContent value="videos" className="mt-4 px-1">
        {renderMediaGrid(videoPosts, "Nenhum vídeo ainda", "play_circle")}
      </TabsContent>

      <TabsContent value="championships" className="mt-4">
        <ChampionshipsTab 
          championships={championships || []} 
          isLoading={championshipsLoading} 
          isOwnProfile={isOwnProfile} 
        />
      </TabsContent>

      <TabsContent value="achievements" className="mt-4">
        <AchievementsTab 
          achievements={achievements || []} 
          isLoading={achievementsLoading} 
          isOwnProfile={isOwnProfile} 
        />
      </TabsContent>
    </Tabs>
  );

  const MainContent = () => (
    <>
      <ProfileHeader username={profile.username} isOwnProfile={isOwnProfile} profileId={profile.id} />
      
      <div className="pt-12 flex flex-col gap-6">
        <ProfileInfo 
          profile={profile} 
          followStats={followStats}
          isOwnProfile={isOwnProfile}
        />
        <div className="px-4">
          <HighlightsSection 
            highlights={highlights || []} 
            isLoading={highlightsLoading}
            isOwnProfile={isOwnProfile}
            profileUsername={profile.username}
            profileAvatarUrl={profile.avatar_url}
          />
        </div>
        <ProfileTabs />
      </div>
    </>
  );

  // Only show RefreshableContainer for own profile
  const ContentWrapper = isOwnProfile ? RefreshableContainer : 'div';
  const wrapperProps = isOwnProfile 
    ? { onRefresh: handleRefresh, isRefreshing: isRefetching, className: "bg-background min-h-screen relative pb-24" }
    : { className: "bg-background min-h-screen relative pb-24" };

  return (
    <ContentWrapper {...wrapperProps as any}>
      {fromOnboarding ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <ProfileHeader username={profile.username} isOwnProfile={isOwnProfile} profileId={profile.id} />
          </motion.div>
          
          <div className="pt-12 flex flex-col gap-6">
            <motion.div variants={itemVariants}>
              <ProfileInfo 
                profile={profile} 
                followStats={followStats}
                isOwnProfile={isOwnProfile}
              />
            </motion.div>
            <div className="px-4">
              <motion.div variants={itemVariants}>
                <HighlightsSection 
                  highlights={highlights || []} 
                  isLoading={highlightsLoading}
                  isOwnProfile={isOwnProfile}
                  profileUsername={profile.username}
                  profileAvatarUrl={profile.avatar_url}
                />
              </motion.div>
            </div>
            <motion.div variants={itemVariants}>
              <ProfileTabs />
            </motion.div>
          </div>
        </motion.div>
      ) : (
        <MainContent />
      )}
      
      {user ? (
        <BottomNavigation activeTab="profile" />
      ) : (
        <GuestBanner />
      )}
    </ContentWrapper>
  );
};

export default Profile;
