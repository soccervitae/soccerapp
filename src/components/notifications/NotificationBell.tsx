import { useUnreadNotificationsCount } from "@/hooks/useNotifications";
import { NotificationsSheet } from "./NotificationsSheet";

export const NotificationBell = () => {
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();

  return (
    <NotificationsSheet>
      <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-foreground transition-colors relative">
        <span className="material-symbols-outlined text-[24px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    </NotificationsSheet>
  );
};
