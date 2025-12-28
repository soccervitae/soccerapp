import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { HighlightsSection } from "@/components/profile/HighlightsSection";
import { PostsGrid } from "@/components/profile/PostsGrid";
import { BottomNavigation } from "@/components/profile/BottomNavigation";
import GuestBanner from "@/components/common/GuestBanner";
import { useParams } from "react-router-dom";
import { 
  useProfile, 
  useProfileByUsername,
  useFollowStats, 
  useUserPosts, 
  useProfileView,
  useUserChampionships,
  useUserAchievements,
  useUserTaggedPosts,
  useUserHighlights
} from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

const Profile = () => {
  const { username } = useParams<{ username?: string }>();
  const { user } = useAuth();
  
  // If username in URL, fetch by username; otherwise show current user's profile
  const { data: profileByUsername, isLoading: usernameLoading } = useProfileByUsername(username || "");
  const { data: profileById, isLoading: idLoading } = useProfile(!username ? user?.id : undefined);
  
  // Use the appropriate profile based on route
  const profile = username ? profileByUsername : profileById;
  const profileLoading = username ? usernameLoading : idLoading;
  const targetUserId = profile?.id;
  
  const { data: followStats, isLoading: statsLoading } = useFollowStats(targetUserId);
  const { data: posts, isLoading: postsLoading } = useUserPosts(targetUserId);
  const { data: championships, isLoading: championshipsLoading } = useUserChampionships(targetUserId);
  const { data: achievements, isLoading: achievementsLoading } = useUserAchievements(targetUserId);
  const { data: taggedPosts, isLoading: taggedLoading } = useUserTaggedPosts(targetUserId);
  const { data: highlights, isLoading: highlightsLoading } = useUserHighlights(targetUserId);
  const profileView = useProfileView();

  // Record profile view
  useEffect(() => {
    if (targetUserId && user && targetUserId !== user.id) {
      profileView.mutate(targetUserId);
    }
  }, [targetUserId, user?.id]);

  const isOwnProfile = user?.id === targetUserId;
  const isLoading = profileLoading || statsLoading;

  if (isLoading) {
    return (
      <main className="bg-background min-h-screen relative pb-24">
        <div className="pt-16">
          <Skeleton className="w-full h-32" />
          <div className="flex flex-col items-center -mt-16 px-4">
            <Skeleton className="w-28 h-28 rounded-full" />
            <Skeleton className="h-6 w-40 mt-4" />
            <Skeleton className="h-4 w-32 mt-2" />
            <Skeleton className="h-20 w-full mt-4 rounded-xl" />
          </div>
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

  return (
    <main className="bg-background min-h-screen relative pb-24">
      <ProfileHeader username={profile.username} isOwnProfile={isOwnProfile} profileId={profile.id} />
      
      <div className="pt-16 flex flex-col gap-6">
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
          />
          <PostsGrid 
            posts={posts || []} 
            taggedPosts={taggedPosts || []}
            championships={championships || []}
            achievements={achievements || []}
            isLoading={postsLoading} 
            isChampionshipsLoading={championshipsLoading}
            isAchievementsLoading={achievementsLoading}
            isTaggedLoading={taggedLoading}
            isOwnProfile={isOwnProfile}
          />
        </div>
      </div>
      
      {user ? (
        <BottomNavigation activeTab="profile" />
      ) : (
        <GuestBanner />
      )}
    </main>
  );
};

export default Profile;
