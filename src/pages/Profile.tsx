import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { HighlightsSection } from "@/components/profile/HighlightsSection";
import { PostsGrid } from "@/components/profile/PostsGrid";
import { BottomNavigation } from "@/components/profile/BottomNavigation";
import { useLocation } from "react-router-dom";

interface Athlete {
  name: string;
  username: string;
  avatar: string;
  position: string;
  team: string;
  verified: boolean;
}

const defaultAthlete: Athlete = {
  name: "Lucas Silva",
  username: "lucas.silva_10",
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuB18b2e4H8Vilu_1rtxonCQj9vAbC1EoysVCEWwBgUUgbOF-Bn6rkp0yDuDlhC79_hCKp-GBhEYsWYVUNvfnntM12RTwF5uu9JD6jn_qN37Woe4qQ5a7YR1CcruWB-DzMIG1d3H39Vzkuk62xFJV4y2aBs-rS2A3zj9NtTjH2DCUzCz_eveY6i6w4PFt7B2vJi13Ows29u2Vt-I0ROOVImcd5oa-LNy__PIB-223eqMByqUaHUp9I_EGjWk0NBo6Mk9BHdwc63_G10",
  position: "Ponta Esquerda",
  team: "São Paulo FC",
  verified: true,
};

const Profile = () => {
  const location = useLocation();
  const athlete: Athlete = location.state?.athlete || defaultAthlete;

  return (
    <main className="bg-background min-h-screen relative pb-24">
      <ProfileHeader username={athlete.username} />
      
      <div className="pt-16 px-4 flex flex-col gap-6">
        <ProfileInfo athlete={athlete} />
        <HighlightsSection />
        <PostsGrid />
      </div>
      
      <BottomNavigation activeTab="profile" />
    </main>
  );
};

export default Profile;
