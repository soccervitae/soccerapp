import { useNavigate } from "react-router-dom";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useConversations } from "@/hooks/useConversations";

export const FeedHeader = () => {
  const navigate = useNavigate();
  const { totalUnread } = useConversations();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
      <img 
        src="https://gkkuttabavwxjuibmrnr.supabase.co/storage/v1/object/public/escudotime/LOGOSITE/soccervitaeoff.png" 
        alt="SOCCER VITAE"
        className="h-6 object-contain"
      />
      <div className="flex items-center gap-2">
        <NotificationBell />
        <button 
          onClick={() => navigate("/messages")}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-foreground transition-colors relative"
        >
          <span className="material-symbols-outlined text-[24px]">chat</span>
          {totalUnread > 0 && (
            <span className="absolute top-1 right-1 min-w-4 h-4 flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-medium rounded-full px-1">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
