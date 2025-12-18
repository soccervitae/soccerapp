import { useNavigate, useLocation } from "react-router-dom";

interface BottomNavigationProps {
  activeTab?: "home" | "search" | "add" | "analytics" | "profile";
}

export const BottomNavigation = ({ activeTab }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentTab = activeTab || (location.pathname === "/feed" ? "home" : "profile");

  return (
    <nav className="fixed bottom-0 w-full bg-background/95 backdrop-blur-md border-t border-border pb-6 pt-2 z-50">
      <div className="flex justify-around items-center">
        <button 
          onClick={() => navigate("/feed")}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${currentTab === "home" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
        >
          <span className={`material-symbols-outlined text-[26px] ${currentTab === "home" ? "fill-1" : ""}`}>home</span>
        </button>
        <button className={`flex flex-col items-center gap-1 p-2 transition-colors ${currentTab === "search" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
          <span className="material-symbols-outlined text-[26px]">search</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-primary transition-colors">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground -mt-4 border-4 border-background shadow-lg shadow-emerald-glow">
            <span className="material-symbols-outlined text-[24px]">add</span>
          </div>
        </button>
        <button className={`flex flex-col items-center gap-1 p-2 transition-colors ${currentTab === "analytics" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
          <span className="material-symbols-outlined text-[26px]">analytics</span>
        </button>
        <button 
          onClick={() => navigate("/")}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${currentTab === "profile" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
        >
          <span className={`material-symbols-outlined text-[26px] ${currentTab === "profile" ? "fill-1" : ""}`}>person</span>
        </button>
      </div>
    </nav>
  );
};
