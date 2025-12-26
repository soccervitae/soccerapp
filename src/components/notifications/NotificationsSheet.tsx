import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from "@/components/ui/responsive-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type Notification,
} from "@/hooks/useNotifications";
import { Bell, Heart, MessageCircle, UserPlus, Check } from "lucide-react";
import { useState } from "react";

interface NotificationsSheetProps {
  children: React.ReactNode;
}

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "like":
      return <Heart className="w-4 h-4 text-red-500" />;
    case "comment":
      return <MessageCircle className="w-4 h-4 text-blue-500" />;
    case "follow":
      return <UserPlus className="w-4 h-4 text-primary" />;
    default:
      return <Bell className="w-4 h-4 text-muted-foreground" />;
  }
};

const getNotificationText = (notification: Notification) => {
  const actorName = notification.actor?.full_name || notification.actor?.username || "Alguém";
  
  switch (notification.type) {
    case "like":
      return `${actorName} curtiu sua publicação`;
    case "comment":
      return `${actorName} comentou: "${notification.content?.slice(0, 50)}${(notification.content?.length || 0) > 50 ? '...' : ''}"`;
    case "follow":
      return `${actorName} começou a torcer por você`;
    default:
      return notification.content || "Nova notificação";
  }
};

const NotificationItem = ({
  notification,
  onRead,
  onClose,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onClose: () => void;
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notification.read) {
      onRead(notification.id);
    }

    onClose();

    // Navigate based on notification type
    if (notification.type === "follow") {
      navigate(`/profile/${notification.actor_id}`);
    } else if (notification.post_id) {
      navigate(`/`); // Could navigate to specific post if route exists
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-start gap-3 p-3 text-left hover:bg-muted/50 transition-colors rounded-lg ${
        !notification.read ? "bg-primary/5" : ""
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={notification.actor?.avatar_url || "/placeholder.svg"}
          alt={notification.actor?.username || "User"}
          className="w-10 h-10 rounded-full object-cover bg-muted"
        />
        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
          <NotificationIcon type={notification.type} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!notification.read ? "font-medium" : "text-muted-foreground"}`}>
          {getNotificationText(notification)}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        </p>
      </div>

      {/* Unread indicator */}
      {!notification.read && (
        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
      )}
    </button>
  );
};

export const NotificationsSheet = ({ children }: NotificationsSheetProps) => {
  const [open, setOpen] = useState(false);
  const { data: notifications, isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleMarkRead = (id: string) => {
    markRead.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  return (
    <ResponsiveModal open={open} onOpenChange={setOpen}>
      <ResponsiveModalTrigger asChild>{children}</ResponsiveModalTrigger>
      <ResponsiveModalContent className="sm:max-w-md h-[80vh] sm:h-[600px] flex flex-col p-0">
        <ResponsiveModalHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <ResponsiveModalTitle className="text-lg">Notificações</ResponsiveModalTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={markAllRead.isPending}
                className="text-xs"
              >
                <Check className="w-3 h-3 mr-1" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </ResponsiveModalHeader>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <Bell className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">Nenhuma notificação</p>
              <p className="text-muted-foreground text-sm mt-1">
                Quando alguém interagir com você, aparecerá aqui
              </p>
            </div>
          ) : (
            <div className="p-2">
              {notifications?.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={handleMarkRead}
                  onClose={() => setOpen(false)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
