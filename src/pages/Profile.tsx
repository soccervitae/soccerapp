import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { HighlightsSection } from "@/components/profile/HighlightsSection";
import { PostsGrid } from "@/components/profile/PostsGrid";
import { BottomNavigation } from "@/components/profile/BottomNavigation";
import GuestBanner from "@/components/common/GuestBanner";
import { RefreshableContainer } from "@/components/common/RefreshableContainer";
import { useParams, useLocation } from "react-router-dom";
import { 
  useProfile, 
  useProfileByUsername,
  useFollowStats, 
  useUserPosts, 
  useProfileView,
  useUserChampionships,
  useUserAchievements,
  useUserTaggedPosts,
  useUserHighlights,
  useUserSavedPosts
} from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const Profile = () => {
  const { username } = useParams<{ username?: string }>();
  const { user } = useAuth();
  const location = useLocation();
  
  // Check if coming from onboarding
  const [fromOnboarding, setFromOnboarding] = useState(false);
  
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
  const { data: posts, isLoading: postsLoading, isFetching: postsFetching, refetch: refetchPosts } = useUserPosts(targetUserId);
  const { data: championships, isLoading: championshipsLoading } = useUserChampionships(targetUserId);
  const { data: achievements, isLoading: achievementsLoading } = useUserAchievements(targetUserId);
  const { data: taggedPosts, isLoading: taggedLoading } = useUserTaggedPosts(targetUserId);
  const { data: highlights, isLoading: highlightsLoading } = useUserHighlights(targetUserId);
  const profileView = useProfileView();

  const isOwnProfile = user?.id === targetUserId;
  
  const { data: savedPosts, isLoading: savedPostsLoading } = useUserSavedPosts(isOwnProfile ? targetUserId : undefined);

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
      refetchPosts(),
    ]);
  };

  const handlePostsRefresh = async () => {
    await refetchPosts();
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

  const MainContent = () => (
    <>
      <ProfileHeader username={profile.username} isOwnProfile={isOwnProfile} profileId={profile.id} />
      
      <div className="pt-12 flex flex-col gap-6">
        <ProfileInfo 
          profile={profile} 
          followStats={followStats}
          isOwnProfile={isOwnProfile}
        />
        <div className="px-4 flex flex-col gap-6">
              <HighlightsSection 
                highlights={highlights || []} 
                isLoading={highlightsLoading}
                isOwnProfile={isOwnProfile}
                profileUsername={profile.username}
                profileAvatarUrl={profile.avatar_url}
              />
          <PostsGrid 
            posts={posts || []} 
            taggedPosts={taggedPosts || []}
            savedPosts={savedPosts || []}
            championships={championships || []}
            achievements={achievements || []}
            isLoading={postsLoading} 
            isChampionshipsLoading={championshipsLoading}
            isAchievementsLoading={achievementsLoading}
            isTaggedLoading={taggedLoading}
            isSavedPostsLoading={savedPostsLoading}
            isOwnProfile={isOwnProfile}
            profile={profile}
            onRefresh={handlePostsRefresh}
            isRefreshing={postsFetching && !postsLoading}
          />
        </div>
      </div>
    </>
  );

  return (
    <RefreshableContainer
      onRefresh={handleRefresh}
      isRefreshing={isRefetching}
      className="bg-background min-h-screen relative pb-24"
    >
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
            <div className="px-4 flex flex-col gap-6">
              <motion.div variants={itemVariants}>
                <HighlightsSection 
                  highlights={highlights || []} 
                  isLoading={highlightsLoading}
                  isOwnProfile={isOwnProfile}
                  profileUsername={profile.username}
                  profileAvatarUrl={profile.avatar_url}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <PostsGrid 
                  posts={posts || []} 
                  taggedPosts={taggedPosts || []}
                  savedPosts={savedPosts || []}
                  championships={championships || []}
                  achievements={achievements || []}
                  isLoading={postsLoading} 
                  isChampionshipsLoading={championshipsLoading}
                  isAchievementsLoading={achievementsLoading}
                  isTaggedLoading={taggedLoading}
                  isSavedPostsLoading={savedPostsLoading}
                  isOwnProfile={isOwnProfile}
                  profile={profile}
                  onRefresh={handlePostsRefresh}
                  isRefreshing={postsFetching && !postsLoading}
                />
              </motion.div>
            </div>
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
    </RefreshableContainer>
  );
};

export default Profile;
