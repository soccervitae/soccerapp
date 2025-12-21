import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { HighlightsSection } from "@/components/profile/HighlightsSection";
import { PostsGrid } from "@/components/profile/PostsGrid";
import { BottomNavigation } from "@/components/profile/BottomNavigation";
import { useParams } from "react-router-dom";
import { useProfile, useFollowStats, useUserPosts, useProfileView } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

const Profile = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user } = useAuth();
  
  // If no userId in params, show current user's profile
  const targetUserId = userId || user?.id;
  
  const { data: profile, isLoading: profileLoading } = useProfile(targetUserId);
  const { data: followStats, isLoading: statsLoading } = useFollowStats(targetUserId);
  const { data: posts, isLoading: postsLoading } = useUserPosts(targetUserId);
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
      <ProfileHeader username={profile.username} />
      
      <div className="pt-16 flex flex-col gap-6">
        <ProfileInfo 
          profile={profile} 
          followStats={followStats}
          isOwnProfile={isOwnProfile}
        />
        <div className="px-4 flex flex-col gap-6">
          <HighlightsSection />
          <PostsGrid posts={posts || []} isLoading={postsLoading} />
        </div>
      </div>
      
      <BottomNavigation activeTab="profile" />
    </main>
  );
};

export default Profile;
