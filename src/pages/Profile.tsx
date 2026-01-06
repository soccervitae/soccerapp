import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { HighlightsSection } from "@/components/profile/HighlightsSection";
import { ChampionshipsTab } from "@/components/profile/ChampionshipsTab";
import { AchievementsTab } from "@/components/profile/AchievementsTab";
import { BottomNavigation } from "@/components/profile/BottomNavigation";
import { useUserPosts, useUserChampionships, useUserAchievements } from "@/hooks/useProfile";
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
import { FeedPost } from "@/components/feed/FeedPost";
import { Skeleton } from "@/components/ui/skeleton";

const Profile = () => {
  const { username } = useParams<{ username?: string }>();
  const { user } = useAuth();
  const location = useLocation();
  
  // Check if coming from onboarding
  const [fromOnboarding, setFromOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  
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
  const { data: posts, isLoading: postsLoading } = useUserPosts(targetUserId);
  const { data: championships, isLoading: championshipsLoading } = useUserChampionships(targetUserId);
  const { data: achievements, isLoading: achievementsLoading } = useUserAchievements(targetUserId);
  const profileView = useProfileView();
  
  // Filter posts by type
  const videoPosts = posts?.filter(post => post.media_type === 'video') || [];
  const photoPosts = posts?.filter(post => post.media_type === 'image' || post.media_type === 'carousel') || [];

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

  // Helper to transform posts for FeedPost component
  const transformPostForFeed = (post: any): import("@/hooks/usePosts").Post => ({
    id: post.id,
    user_id: post.user_id,
    content: post.content,
    media_url: post.media_url,
    media_type: post.media_type,
    created_at: post.created_at,
    updated_at: post.updated_at || null,
    likes_count: post.likes_count || 0,
    comments_count: post.comments_count || 0,
    shares_count: post.shares_count || 0,
    location_name: post.location_name || null,
    location_lat: post.location_lat || null,
    location_lng: post.location_lng || null,
    music_track_id: post.music_track_id || null,
    music_start_seconds: post.music_start_seconds || null,
    music_end_seconds: post.music_end_seconds || null,
    music_track: post.music_track || null,
    liked_by_user: post.isLiked || false,
    saved_by_user: post.isSaved || false,
    recent_likes: post.recent_likes || [],
    profile: {
      id: profile.id,
      username: profile.username,
      full_name: profile.full_name || null,
      nickname: profile.nickname || null,
      avatar_url: profile.avatar_url || null,
      team: profile.team || null,
      conta_verificada: profile.conta_verificada || false,
      gender: profile.gender || null,
      role: profile.role || null,
      posicaomas: profile.posicaomas || null,
      posicaofem: profile.posicaofem || null,
      funcao: profile.funcao || null,
      position_name: profile.position_name || null,
    },
  });

  // Render posts list component
  const renderPostsList = (postsToRender: any[], loading: boolean, emptyMessage: string, emptyIcon: string) => {
    if (loading) {
      return (
        <div className="space-y-4 px-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="w-full aspect-[4/5] rounded-lg" />
            </div>
          ))}
        </div>
      );
    }

    if (!postsToRender || postsToRender.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <span className="material-symbols-outlined text-[48px] mb-2">{emptyIcon}</span>
          <p className="text-sm">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {postsToRender.map(post => (
          <FeedPost key={post.id} post={transformPostForFeed(post)} />
        ))}
      </div>
    );
  };

  // Profile tabs component
  const ProfileTabs = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
      <TabsList className="w-full h-12 bg-transparent border-b border-border rounded-none p-0 flex justify-around">
        <TabsTrigger 
          value="posts" 
          className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-semibold"
        >
          <span className="material-symbols-outlined text-[20px]">grid_on</span>
        </TabsTrigger>
        <TabsTrigger 
          value="videos" 
          className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-semibold"
        >
          <span className="material-symbols-outlined text-[20px]">play_circle</span>
        </TabsTrigger>
        <TabsTrigger 
          value="championships" 
          className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-semibold"
        >
          <span className="material-symbols-outlined text-[20px]">sports_soccer</span>
        </TabsTrigger>
        <TabsTrigger 
          value="achievements" 
          className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-semibold"
        >
          <span className="material-symbols-outlined text-[20px]">trophy</span>
        </TabsTrigger>
        <TabsTrigger 
          value="photos" 
          className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-semibold"
        >
          <span className="material-symbols-outlined text-[20px]">photo_library</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="posts" className="mt-4">
        {renderPostsList(posts || [], postsLoading, "Nenhum post ainda", "grid_on")}
      </TabsContent>

      <TabsContent value="videos" className="mt-4">
        {renderPostsList(videoPosts, postsLoading, "Nenhum vídeo ainda", "play_circle")}
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

      <TabsContent value="photos" className="mt-4">
        {renderPostsList(photoPosts, postsLoading, "Nenhuma foto ainda", "photo_library")}
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
