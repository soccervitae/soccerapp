import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CreatePostSheet } from "@/components/feed/CreatePostSheet";
import { CreateMenuSheet } from "@/components/feed/CreateMenuSheet";
import { AddChampionshipSheet } from "@/components/profile/AddChampionshipSheet";
import { AddAchievementSheet } from "@/components/profile/AddAchievementSheet";
import { TeamSelector } from "@/components/profile/TeamSelector";
import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/contexts/AuthContext";
import { useUserTeams } from "@/hooks/useTeams";

interface BottomNavigationProps {
  activeTab?: "home" | "search" | "add" | "messages" | "profile";
}

export const BottomNavigation = ({ activeTab }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalUnread } = useConversations();
  const { user } = useAuth();
  const { data: userTeams = [] } = useUserTeams(user?.id);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [isTimesOpen, setIsTimesOpen] = useState(false);
  const [isChampionshipOpen, setIsChampionshipOpen] = useState(false);
  const [isAchievementOpen, setIsAchievementOpen] = useState(false);
  
  const currentTab = activeTab || (location.pathname === "/profile" ? "profile" : location.pathname === "/explore" ? "search" : location.pathname === "/messages" ? "messages" : "home");

  const handleSelectOption = (option: "post" | "times" | "championship" | "achievement") => {
    switch (option) {
      case "post":
        setIsPostOpen(true);
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

  return (
    <>
      <nav className="fixed bottom-0 w-full bg-background/95 backdrop-blur-md border-t border-border pb-6 pt-2 z-50">
        <div className="flex justify-around items-center">
          <button 
            onClick={() => navigate("/")}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${currentTab === "home" ? "text-nav-active" : "text-muted-foreground hover:text-nav-active"}`}
          >
            <span className={`material-symbols-outlined text-[26px] ${currentTab === "home" ? "fill-1" : ""}`}>home</span>
          </button>
          <button 
            onClick={() => navigate("/explore")}
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
            onClick={() => navigate("/messages")}
            className={`flex flex-col items-center gap-1 p-2 transition-colors relative ${currentTab === "messages" ? "text-nav-active" : "text-muted-foreground hover:text-nav-active"}`}
          >
            <span className={`material-symbols-outlined text-[26px] ${currentTab === "messages" ? "fill-1" : ""}`}>chat</span>
            {totalUnread > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
            )}
          </button>
          <button 
            onClick={() => navigate("/profile")}
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

      <TeamSelector 
        open={isTimesOpen} 
        onOpenChange={setIsTimesOpen}
        selectedTeamIds={userTeams.map(t => t.id)}
      />

      <AddChampionshipSheet 
        open={isChampionshipOpen} 
        onOpenChange={setIsChampionshipOpen} 
      />

      <AddAchievementSheet 
        open={isAchievementOpen} 
        onOpenChange={setIsAchievementOpen} 
      />
    </>
  );
};
