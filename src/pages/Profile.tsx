import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { HighlightsSection } from "@/components/profile/HighlightsSection";
import { ChampionshipsTab } from "@/components/profile/ChampionshipsTab";
import { AchievementsTab } from "@/components/profile/AchievementsTab";
import { BottomNavigation } from "@/components/profile/BottomNavigation";
import { FeedPost } from "@/components/feed/FeedPost";
import { useUserChampionships, useUserAchievements, useUserPosts } from "@/hooks/useProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { type Post } from "@/hooks/usePosts";
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
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileFeedSheet } from "@/components/profile/ProfileFeedSheet";

const Profile = () => {
  const { username } = useParams<{ username?: string }>();
  const { user } = useAuth();
  const location = useLocation();
  
  // Check if coming from onboarding
  const [fromOnboarding, setFromOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [feedSheetOpen, setFeedSheetOpen] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  const [feedSheetOriginRect, setFeedSheetOriginRect] = useState<DOMRect | null>(null);
  const gridItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  
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

  // Transform user post to Post format for FeedPost
  const transformToFeedPost = (post: NonNullable<typeof userPosts>[0]): Post => ({
    id: post.id,
    user_id: post.user_id,
    content: post.content,
    media_url: post.media_url,
    media_type: post.media_type,
    created_at: post.created_at,
    likes_count: post.likes_count || 0,
    comments_count: post.comments_count || 0,
    shares_count: 0,
    location_name: null,
    location_lat: null,
    location_lng: null,
    music_track_id: null,
    music_start_seconds: null,
    music_end_seconds: null,
    updated_at: post.updated_at,
    liked_by_user: post.liked_by_user || false,
    saved_by_user: post.saved_by_user || false,
    recent_likes: [],
    profile: {
      id: profile?.id || '',
      username: profile?.username || '',
      avatar_url: profile?.avatar_url || null,
      full_name: profile?.full_name || null,
      nickname: profile?.nickname || null,
      team: profile?.team || null,
      conta_verificada: profile?.conta_verificada || false,
      gender: profile?.gender || null,
      role: profile?.role || null,
      posicaomas: profile?.posicaomas || null,
      posicaofem: profile?.posicaofem || null,
      funcao: profile?.funcao || null,
      position_name: profile?.position_name || null,
    },
    music_track: null,
  });

  // Handle grid item click
  const handleGridItemClick = (index: number, element: HTMLDivElement | null) => {
    if (element) {
      setFeedSheetOriginRect(element.getBoundingClientRect());
    }
    setSelectedPostIndex(index);
    setFeedSheetOpen(true);
  };

  // Render profile feed as grid
  const renderProfileFeed = () => {
    if (postsLoading) {
      return (
        <div className="grid grid-cols-3 gap-1">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse rounded-sm" />
          ))}
        </div>
      );
    }

    if (!userPosts || userPosts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <span className="material-symbols-outlined text-[48px] mb-2">grid_view</span>
          <p className="text-sm">Nenhuma publicação ainda</p>
        </div>
      );
    }

      return (
        <div className="grid grid-cols-3 gap-px">
        {userPosts.map((post, index) => {
          const mediaUrls = post.media_url?.split(',') || [];
          const firstMedia = mediaUrls[0];
          const isVideo = post.media_type === 'video';
          const isCarousel = post.media_type === 'carousel' && mediaUrls.length > 1;

          return (
            <div 
              key={post.id} 
              ref={(el) => { gridItemRefs.current[index] = el; }}
              className="aspect-square relative overflow-hidden bg-muted cursor-pointer"
              onClick={() => handleGridItemClick(index, gridItemRefs.current[index])}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
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

  // Tab order for swipe navigation
  const tabOrder = ["profile", "videos", "championships", "achievements", "photos"];
  
  // Handle swipe gesture
  const handleSwipe = (direction: "left" | "right") => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (direction === "left" && currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    } else if (direction === "right" && currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1]);
    }
  };

  // Check if has highlights
  const hasHighlights = highlights && highlights.length > 0;

  // Profile tabs component
  const ProfileTabs = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className={`w-full ${hasHighlights ? 'mt-6' : 'mt-2'}`}>
      <TabsList className="w-full h-auto bg-transparent p-0 border-b border-border flex justify-between">
        <TabsTrigger 
          value="profile" 
          className="flex-1 flex-col gap-0.5 text-[10px] py-2 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-muted-foreground"
        >
          <span className="material-symbols-outlined text-[18px]">grid_on</span>
          Posts
        </TabsTrigger>
        <TabsTrigger 
          value="videos" 
          className="flex-1 flex-col gap-0.5 text-[10px] py-2 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-muted-foreground"
        >
          <span className="material-symbols-outlined text-[18px]">play_circle</span>
          Vídeos
        </TabsTrigger>
        <TabsTrigger 
          value="championships" 
          className="flex-1 flex-col gap-0.5 text-[10px] py-2 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-muted-foreground"
        >
          <span className="material-symbols-outlined text-[18px]">sports_soccer</span>
          Campeonatos
        </TabsTrigger>
        <TabsTrigger 
          value="achievements" 
          className="flex-1 flex-col gap-0.5 text-[10px] py-2 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-muted-foreground"
        >
          <span className="material-symbols-outlined text-[18px]">trophy</span>
          Conquistas
        </TabsTrigger>
        <TabsTrigger 
          value="photos" 
          className="flex-1 flex-col gap-0.5 text-[10px] py-2 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-muted-foreground"
        >
          <span className="material-symbols-outlined text-[18px]">photo_library</span>
          Fotos
        </TabsTrigger>
      </TabsList>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.x < -50) {
            handleSwipe("left");
          } else if (info.offset.x > 50) {
            handleSwipe("right");
          }
        }}
      >
        <TabsContent value="profile" className="mt-4" forceMount={activeTab === "profile" ? true : undefined}>
          {activeTab === "profile" && renderProfileFeed()}
        </TabsContent>

        <TabsContent value="videos" className="mt-4 px-1" forceMount={activeTab === "videos" ? true : undefined}>
          {activeTab === "videos" && renderMediaGrid(videoPosts, "Nenhum vídeo ainda", "play_circle")}
        </TabsContent>

        <TabsContent value="championships" className="mt-4" forceMount={activeTab === "championships" ? true : undefined}>
          {activeTab === "championships" && (
            <ChampionshipsTab 
              championships={championships || []} 
              isLoading={championshipsLoading} 
              isOwnProfile={isOwnProfile} 
            />
          )}
        </TabsContent>

        <TabsContent value="achievements" className="mt-4" forceMount={activeTab === "achievements" ? true : undefined}>
          {activeTab === "achievements" && (
            <AchievementsTab 
              achievements={achievements || []} 
              isLoading={achievementsLoading} 
              isOwnProfile={isOwnProfile} 
            />
          )}
        </TabsContent>

        <TabsContent value="photos" className="mt-4 px-1" forceMount={activeTab === "photos" ? true : undefined}>
          {activeTab === "photos" && renderMediaGrid(photoPosts, "Nenhuma foto ainda", "photo_library")}
        </TabsContent>
      </motion.div>
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

      {/* Profile Feed Sheet */}
      {profile && userPosts && (
        <ProfileFeedSheet
          posts={userPosts}
          initialPostIndex={selectedPostIndex}
          isOpen={feedSheetOpen}
          onClose={() => setFeedSheetOpen(false)}
          profile={{
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name,
            nickname: profile.nickname,
            avatar_url: profile.avatar_url,
            conta_verificada: profile.conta_verificada,
            gender: profile.gender,
            role: profile.role,
            posicaomas: profile.posicaomas,
            posicaofem: profile.posicaofem,
            funcao: profile.funcao,
            position_name: profile.position_name,
          }}
          originRect={feedSheetOriginRect}
        />
      )}
    </ContentWrapper>
  );
};

export default Profile;
