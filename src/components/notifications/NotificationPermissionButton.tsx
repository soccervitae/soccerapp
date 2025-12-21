import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";

export const NotificationPermissionButton = () => {
  const { isSupported, permission, requestPermission, isGranted, isDenied } = usePushNotifications();
  const { toast } = useToast();

  const handleRequest = async () => {
    const granted = await requestPermission();
    
    if (granted) {
      toast({
        title: "Notificações ativadas",
        description: "Você receberá notificações de novas mensagens.",
      });
    } else {
      toast({
        title: "Notificações bloqueadas",
        description: "Você pode ativá-las nas configurações do navegador.",
        variant: "destructive",
      });
    }
  };

  if (!isSupported) return null;

  if (isGranted) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Bell className="h-4 w-4 text-primary" />
        <span>Notificações ativas</span>
      </div>
    );
  }

  if (isDenied) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="h-4 w-4" />
        <span>Notificações bloqueadas</span>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRequest} className="gap-2">
      <Bell className="h-4 w-4" />
      Ativar notificações
    </Button>
  );
};
