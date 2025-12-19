import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { StatsSection } from "@/components/profile/StatsSection";
import { HighlightsSection } from "@/components/profile/HighlightsSection";
import { PostsGrid } from "@/components/profile/PostsGrid";
import { BottomNavigation } from "@/components/profile/BottomNavigation";

const Profile = () => {
  return (
    <main className="bg-background min-h-screen relative pb-24">
      {/* Status bar spacer */}
      <div className="h-12 w-full bg-background/95 backdrop-blur-md fixed top-0 z-50" />
      
      <ProfileHeader username="lucas.silva_10" />
      
      <div className="pt-28 px-4 flex flex-col gap-6">
        <ProfileInfo />
        <StatsSection />
        <HighlightsSection />
        <PostsGrid />
      </div>
      
      <BottomNavigation activeTab="profile" />
    </main>
  );
};

export default Profile;
