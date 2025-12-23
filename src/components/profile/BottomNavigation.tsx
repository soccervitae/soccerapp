import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CreatePostSheet } from "@/components/feed/CreatePostSheet";

interface BottomNavigationProps {
  activeTab?: "home" | "search" | "add" | "analytics" | "profile";
}

export const BottomNavigation = ({ activeTab }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  
  const currentTab = activeTab || (location.pathname === "/profile" ? "profile" : location.pathname === "/explore" ? "search" : "home");

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
            onClick={() => setIsCreatePostOpen(true)}
            className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-nav-active transition-colors"
          >
            <div className="w-10 h-10 bg-nav-active rounded-full flex items-center justify-center text-white -mt-4 border-4 border-background shadow-lg">
              <span className="material-symbols-outlined text-[24px]">add</span>
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

      <CreatePostSheet 
        open={isCreatePostOpen} 
        onOpenChange={setIsCreatePostOpen} 
      />
    </>
  );
};
