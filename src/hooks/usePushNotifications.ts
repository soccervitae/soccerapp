import { useState, useEffect, useCallback } from "react";

type NotificationPermissionState = "default" | "granted" | "denied";

// Use the service worker already registered by VitePWA instead of manually registering a separate one
const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!("serviceWorker" in navigator)) return null;
  
  try {
    // Wait for the VitePWA-registered service worker to be ready
    const registration = await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error("[PushNotifications] Failed to get SW registration:", error);
    return null;
  }
};

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermissionState>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const supported = "Notification" in window && "serviceWorker" in navigator;
    setIsSupported(supported);

    if (!supported) return;

    setPermission(Notification.permission);

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "NOTIFICATION_CLICK") {
        window.location.href = event.data.url;
      }
    };

    getServiceWorkerRegistration()
      .then((reg) => {
        if (reg) {
          console.log("Service Worker ready:", reg);
          setRegistration(reg);
        }
      })
      .catch((err) => {
        console.error("Service Worker registration failed:", err);
      });

    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
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

      if (document.visibilityState === "visible" && conversationId && window.location.pathname.includes(conversationId)) {
        return;
      }

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

  const showCallNotification = useCallback(
    async (
      callerName: string,
      callType: "video" | "voice",
      conversationId: string,
      callerId: string
    ) => {
      if (!isSupported || permission !== "granted" || !registration) return;

      if (registration.active) {
        registration.active.postMessage({
          type: "SHOW_CALL_NOTIFICATION",
          callerName,
          callType,
          conversationId,
          callerId,
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
    showCallNotification,
    isGranted: permission === "granted",
    isDenied: permission === "denied",
  };
};
