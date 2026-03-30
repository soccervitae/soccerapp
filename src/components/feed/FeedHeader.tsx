import { NotificationBell } from "@/components/notifications/NotificationBell";

export const FeedHeader = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/30 px-4 h-14 flex items-center justify-between">
      <img 
        src="https://wdgpmpgdlauiawbtbxmn.supabase.co/storage/v1/object/public/site-assets/SOCCERVITAE_LOGO_NOVO_verde.png" 
        alt="SOCCER VITAE"
        className="h-4 object-contain"
      />
      <div className="flex items-center gap-2">
        <NotificationBell />
      </div>
    </div>
  );
};
