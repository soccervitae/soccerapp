import { forwardRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CreatePostSheet } from "@/components/feed/CreatePostSheet";
import { CreateMenuSheet } from "@/components/feed/CreateMenuSheet";
import { CreateReplaySheet } from "@/components/feed/CreateReplaySheet";
import { AddChampionshipSheet } from "@/components/profile/AddChampionshipSheet";
import { AddAchievementSheet } from "@/components/profile/AddAchievementSheet";
import { AddHighlightSheet } from "@/components/profile/AddHighlightSheet";
import { SelectHighlightSheet } from "@/components/profile/SelectHighlightSheet";
import { EditHighlightSheet } from "@/components/profile/EditHighlightSheet";
import { TeamSelector } from "@/components/profile/TeamSelector";
import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/contexts/AuthContext";
import { useUserTeams } from "@/hooks/useTeams";
import { useUserHighlights, UserHighlight } from "@/hooks/useProfile";

interface BottomNavigationProps {
  activeTab?: "home" | "search" | "add" | "messages" | "profile";
}

export const BottomNavigation = forwardRef<HTMLElement, BottomNavigationProps>(({ activeTab }, ref) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalUnread } = useConversations();
  const { user } = useAuth();
  const { data: userTeams = [] } = useUserTeams(user?.id);
  const { data: highlights = [] } = useUserHighlights(user?.id);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [isReplayOpen, setIsReplayOpen] = useState(false);
  const [isSelectHighlightOpen, setIsSelectHighlightOpen] = useState(false);
  const [isAddHighlightOpen, setIsAddHighlightOpen] = useState(false);
  const [isEditHighlightOpen, setIsEditHighlightOpen] = useState(false);
  const [selectedHighlightToEdit, setSelectedHighlightToEdit] = useState<UserHighlight | null>(null);
  const [isTimesOpen, setIsTimesOpen] = useState(false);
  const [isChampionshipOpen, setIsChampionshipOpen] = useState(false);
  const [isAchievementOpen, setIsAchievementOpen] = useState(false);
  
  const currentTab = activeTab || (location.pathname === "/profile" || location.pathname.startsWith("/profile/") ? "profile" : location.pathname === "/explore" ? "search" : location.pathname === "/messages" ? "messages" : location.pathname === "/" ? "home" : undefined);

  const handleHomeClick = () => {
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.dispatchEvent(new CustomEvent('home-tab-pressed'));
    } else {
      navigate("/");
    }
  };

  const handleExploreClick = () => {
    if (location.pathname === "/explore") {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.dispatchEvent(new CustomEvent('explore-tab-pressed'));
    } else {
      navigate("/explore");
    }
  };

  const handleMessagesClick = () => {
    if (location.pathname === "/messages") {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.dispatchEvent(new CustomEvent('messages-tab-pressed'));
    } else {
      navigate("/messages");
    }
  };

  const handleProfileClick = () => {
    if (location.pathname === "/profile") {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.dispatchEvent(new CustomEvent('profile-tab-pressed'));
    } else {
      navigate("/profile");
    }
  };

  const handleSelectOption = (option: "post" | "replay" | "highlight" | "times" | "championship" | "achievement") => {
    switch (option) {
      case "post":
        setIsPostOpen(true);
        break;
      case "replay":
        setIsReplayOpen(true);
        break;
      case "highlight":
        setIsSelectHighlightOpen(true);
        break;
      case "times":
        setIsTimesOpen(true);
        break;
      case "championship":
        setIsChampionshipOpen(true);
        break;
      case "achievement":
        setIsAchievementOpen(true);
        break;
    }
  };

  const handleSelectExistingHighlight = (highlight: UserHighlight) => {
    setSelectedHighlightToEdit(highlight);
    setIsSelectHighlightOpen(false);
    setIsEditHighlightOpen(true);
  };

  return (
    <>
      <nav ref={ref} className="fixed bottom-0 w-full bg-background/95 backdrop-blur-md border-t border-border pb-6 pt-2 z-50">
        <div className="flex justify-around items-center">
          <button 
            onClick={handleHomeClick}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${currentTab === "home" ? "text-nav-active" : "text-muted-foreground hover:text-nav-active"}`}
          >
            <span className={`material-symbols-outlined text-[26px] ${currentTab === "home" ? "fill-1" : ""}`}>home</span>
          </button>
          <button 
            onClick={handleExploreClick}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${currentTab === "search" ? "text-nav-active" : "text-muted-foreground hover:text-nav-active"}`}
          >
            <span className={`material-symbols-outlined text-[26px] ${currentTab === "search" ? "fill-1" : ""}`}>search</span>
          </button>
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-nav-active transition-colors"
          >
            <div className="w-10 h-10 bg-nav-active rounded-full flex items-center justify-center text-white -mt-4 border-4 border-background shadow-lg">
              <span className="material-symbols-outlined text-[24px]">add</span>
            </div>
          </button>
          <button 
            onClick={handleMessagesClick}
            className={`flex flex-col items-center gap-1 p-2 transition-colors relative ${currentTab === "messages" ? "text-nav-active" : "text-muted-foreground hover:text-nav-active"}`}
          >
            <span className={`material-symbols-outlined text-[26px] ${currentTab === "messages" ? "fill-1" : ""}`}>chat</span>
            {totalUnread > 0 && (
              <span className="absolute -top-0.5 right-0 min-w-5 h-5 px-1.5 bg-destructive rounded-full flex items-center justify-center text-[10px] font-bold text-destructive-foreground border-2 border-background">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </button>
          <button 
            onClick={handleProfileClick}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${currentTab === "profile" ? "text-nav-active" : "text-muted-foreground hover:text-nav-active"}`}
          >
            <span className={`material-symbols-outlined text-[26px] ${currentTab === "profile" ? "fill-1" : ""}`}>person</span>
          </button>
        </div>
      </nav>

      <CreateMenuSheet 
        open={isMenuOpen} 
        onOpenChange={setIsMenuOpen}
        onSelectOption={handleSelectOption}
      />

      <CreatePostSheet 
        open={isPostOpen} 
        onOpenChange={setIsPostOpen} 
      />

      <CreateReplaySheet 
        open={isReplayOpen} 
        onOpenChange={setIsReplayOpen} 
      />

      <SelectHighlightSheet
        open={isSelectHighlightOpen}
        onOpenChange={setIsSelectHighlightOpen}
        highlights={highlights}
        onSelectHighlight={handleSelectExistingHighlight}
        onCreateNew={() => setIsAddHighlightOpen(true)}
      />

      <AddHighlightSheet 
        open={isAddHighlightOpen} 
        onOpenChange={setIsAddHighlightOpen} 
      />

      <EditHighlightSheet
        open={isEditHighlightOpen}
        onOpenChange={setIsEditHighlightOpen}
        highlight={selectedHighlightToEdit}
      />

      <TeamSelector 
        open={isTimesOpen} 
        onOpenChange={setIsTimesOpen}
        selectedTeamIds={userTeams.map(t => t.id)}
      />

      <AddChampionshipSheet 
        open={isChampionshipOpen} 
        onOpenChange={setIsChampionshipOpen}
        userTeams={userTeams}
      />

      <AddAchievementSheet 
        open={isAchievementOpen} 
        onOpenChange={setIsAchievementOpen}
        userTeams={userTeams}
      />
    </>
  );
});

BottomNavigation.displayName = "BottomNavigation";
