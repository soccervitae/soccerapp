import { useState, useEffect, useCallback } from "react";

type NotificationPermissionState = "default" | "granted" | "denied";

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermissionState>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const supported = "Notification" in window && "serviceWorker" in navigator;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);

      // Register service worker
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        console.log("Service Worker registered:", reg);
        setRegistration(reg);
      }).catch((err) => {
        console.error("Service Worker registration failed:", err);
      });

      // Listen for notification clicks
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "NOTIFICATION_CLICK") {
          window.location.href = event.data.url;
        }
      });
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback(
    async (title: string, body: string, url?: string, conversationId?: string) => {
      if (!isSupported || permission !== "granted" || !registration) return;

      // Check if app is in foreground
      if (document.visibilityState === "visible") {
        // Don't show notification if user is already viewing the chat
        if (conversationId && window.location.pathname.includes(conversationId)) {
          return;
        }
      }

      // Send message to service worker to show notification
      if (registration.active) {
        registration.active.postMessage({
          type: "SHOW_NOTIFICATION",
          title,
          body,
          url: url || "/messages",
          conversationId,
        });
      }
    },
    [isSupported, permission, registration]
  );

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    isGranted: permission === "granted",
    isDenied: permission === "denied",
  };
};
