import { NotificationBell } from "@/components/notifications/NotificationBell";

export const FeedHeader = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
      <img 
        src="https://gkkuttabavwxjuibmrnr.supabase.co/storage/v1/object/public/escudotime/LOGOSITE/soccervitaeoff.png" 
        alt="SOCCER VITAE"
        className="h-6 object-contain"
      />
      <div className="flex items-center gap-2">
        <NotificationBell />
      </div>
    </div>
  );
};
