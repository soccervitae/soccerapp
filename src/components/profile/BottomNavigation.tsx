import { forwardRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CreateMenuSheet } from "@/components/feed/CreateMenuSheet";
import { AddChampionshipSheet } from "@/components/profile/AddChampionshipSheet";
import { AddAchievementSheet } from "@/components/profile/AddAchievementSheet";

import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/contexts/AuthContext";
import { useUserTeams } from "@/hooks/useTeams";

const NavIcon = ({ 
  isActive, 
  icon, 
  onClick, 
  badge 
}: { 
  isActive: boolean; 
  icon: string; 
  onClick: (e: React.MouseEvent) => void; 
  badge?: number;
}) => (
  <motion.button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 transition-colors relative ${
      isActive ? "text-nav-active" : "text-muted-foreground hover:text-nav-active"
    }`}
    whileTap={{ scale: 0.9 }}
  >
    <motion.span
      className={`material-symbols-outlined text-[26px] ${isActive ? "fill-1" : ""}`}
      animate={{
        scale: isActive ? 1.1 : 1,
        y: isActive ? -2 : 0,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {icon}
    </motion.span>
    {badge !== undefined && badge > 0 && (
      <span className="absolute -top-0.5 right-0 min-w-5 h-5 px-1.5 bg-destructive rounded-full flex items-center justify-center text-[10px] font-bold text-destructive-foreground border-2 border-background">
        {badge > 99 ? "99+" : badge}
      </span>
    )}
  </motion.button>
);

interface BottomNavigationProps {
  activeTab?: "home" | "search" | "add" | "messages" | "profile";
}

export const BottomNavigation = forwardRef<HTMLElement, BottomNavigationProps>(({ activeTab }, ref) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalUnread } = useConversations();
  const { user } = useAuth();
  const { data: userTeams = [] } = useUserTeams(user?.id);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChampionshipOpen, setIsChampionshipOpen] = useState(false);
  const [isAchievementOpen, setIsAchievementOpen] = useState(false);
  
  // Detect current tab based on route
  const getCurrentTab = (): "home" | "search" | "add" | "messages" | "profile" => {
    const path = location.pathname;
    
    // Home - only root
    if (path === "/") return "home";
    
    // Explore/Search
    if (path === "/explore" || path.startsWith("/explore/")) return "search";
    
    // Messages - /messages and /chat/:id
    if (path === "/messages" || path.startsWith("/messages/") || path.startsWith("/chat/")) return "messages";
    
    // Profile - /profile, /settings, /teams, or username routes (single segment like /rogergomes)
    if (path === "/profile" || path.startsWith("/profile/") || 
        path === "/settings" || path.startsWith("/settings/") ||
        path === "/teams" || path.startsWith("/teams/")) {
      return "profile";
    }
    
    // Username routes - single path segment that's not a reserved route
    const reservedRoutes = ["/explore", "/messages", "/chat", "/auth", "/install", "/welcome", "/login", "/forgot-password"];
    const isReservedRoute = reservedRoutes.some(route => path === route || path.startsWith(route + "/"));
    const isSingleSegmentRoute = path !== "/" && path.split("/").filter(Boolean).length === 1;
    
    if (!isReservedRoute && isSingleSegmentRoute) {
      return "profile"; // Username profile route like /rogergomes
    }
    
    // Default to home for unknown routes
    return "home";
  };
  
  const currentTab = activeTab || getCurrentTab();

  const handleHomeClick = () => {
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.dispatchEvent(new CustomEvent('home-tab-pressed'));
    } else {
      navigate("/");
      // Fallback for PWA navigation issues
      setTimeout(() => {
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
      }, 100);
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
        navigate("/create-post");
        break;
      case "replay":
        navigate("/create-replay");
        break;
      case "highlight":
        navigate("/create-highlight");
        break;
      case "times":
        navigate("/select-teams");
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
      <nav ref={ref} className="fixed bottom-0 w-full bg-background/95 backdrop-blur-md border-t border-border pb-6 pt-2 z-50">
        <div className="flex justify-around items-center">
          <NavIcon
            isActive={currentTab === "home"}
            icon="home"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleHomeClick();
            }}
          />
          <NavIcon
            isActive={currentTab === "search"}
            icon="search"
            onClick={handleExploreClick}
          />
          <motion.button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-nav-active transition-colors"
            whileTap={{ scale: 0.9 }}
          >
            <motion.div 
              className="w-10 h-10 bg-nav-active rounded-full flex items-center justify-center text-white -mt-4 border-4 border-background shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95, rotate: 90 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <span className="material-symbols-outlined text-[24px]">add</span>
            </motion.div>
          </motion.button>
          <NavIcon
            isActive={currentTab === "messages"}
            icon="chat"
            onClick={handleMessagesClick}
            badge={totalUnread}
          />
          <NavIcon
            isActive={currentTab === "profile"}
            icon="person"
            onClick={handleProfileClick}
          />
        </div>
      </nav>

      <CreateMenuSheet 
        open={isMenuOpen} 
        onOpenChange={setIsMenuOpen}
        onSelectOption={handleSelectOption}
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
