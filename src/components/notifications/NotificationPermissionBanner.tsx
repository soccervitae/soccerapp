import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useIsPWA } from "@/hooks/useIsPWA";
import { motion, AnimatePresence } from "framer-motion";

export const NotificationPermissionBanner = () => {
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const isPWA = useIsPWA();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isSupported || !isPWA || permission !== "default") return;
    const wasDismissed = localStorage.getItem("notification-banner-dismissed");
    if (wasDismissed) return;
    // Show after a small delay
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, [isSupported, isPWA, permission]);

  const handleAllow = async () => {
    await requestPermission();
    setShow(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
    localStorage.setItem("notification-banner-dismissed", "true");
  };

  if (dismissed || !show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mx-4 mt-2 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-3"
        >
          <Bell className="h-5 w-5 text-primary shrink-0" />
          <p className="text-sm text-foreground flex-1">
            Ative as notificações para saber quando receber novas mensagens!
          </p>
          <Button size="sm" onClick={handleAllow} className="shrink-0 text-xs h-7">
            Ativar
          </Button>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
