import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CreatePostSheet } from "@/components/feed/CreatePostSheet";
import { CreateMenuSheet } from "@/components/feed/CreateMenuSheet";
import { CreateReplaySheet } from "@/components/feed/CreateReplaySheet";
import { AddChampionshipSheet } from "@/components/profile/AddChampionshipSheet";
import { AddAchievementSheet } from "@/components/profile/AddAchievementSheet";

interface BottomNavigationProps {
  activeTab?: "home" | "search" | "add" | "analytics" | "profile";
}

export const BottomNavigation = ({ activeTab }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [isReplayOpen, setIsReplayOpen] = useState(false);
  const [isChampionshipOpen, setIsChampionshipOpen] = useState(false);
  const [isAchievementOpen, setIsAchievementOpen] = useState(false);
  
  const currentTab = activeTab || (location.pathname === "/profile" ? "profile" : location.pathname === "/explore" ? "search" : "home");

  const handleSelectOption = (option: "post" | "replay" | "championship" | "achievement") => {
    switch (option) {
      case "post":
        setIsPostOpen(true);
        break;
      case "replay":
        setIsReplayOpen(true);
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
            <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">add</span>
            </div>
          </button>
          <button className={`flex flex-col items-center gap-1 p-2 transition-colors ${currentTab === "analytics" ? "text-nav-active" : "text-muted-foreground hover:text-nav-active"}`}>
            <span className="material-symbols-outlined text-[26px]">analytics</span>
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

      <CreateReplaySheet 
        open={isReplayOpen} 
        onOpenChange={setIsReplayOpen} 
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
