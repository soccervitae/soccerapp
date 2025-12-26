import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/.test(userAgent);
  const isMobile = isIOS || isAndroid || /webOS|BlackBerry|Opera Mini|IEMobile/.test(userAgent);
  
  return { isIOS, isAndroid, isMobile };
};

export const usePwaInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({ isIOS: false, isAndroid: false, isMobile: false });

  useEffect(() => {
    // Detect device
    const info = getDeviceInfo();
    setDeviceInfo(info);

    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true);
      return;
    }

    // Check if user previously dismissed
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedAt = new Date(dismissed);
      const now = new Date();
      const daysSinceDismissed = (now.getTime() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
      
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setIsDismissed(true);
      }
    }

    // For iOS, set installable true since beforeinstallprompt won't fire
    if (info.isIOS) {
      setIsInstallable(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      localStorage.removeItem("pwa-install-dismissed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      
      setDeferredPrompt(null);
      return outcome === "accepted";
    } catch (error) {
      console.error("Error prompting install:", error);
      return false;
    }
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
    localStorage.setItem("pwa-install-dismissed", new Date().toISOString());
  }, []);

  const canShowPrompt = isInstallable && !isInstalled && !isDismissed && deviceInfo.isMobile;

  return {
    isInstallable,
    isInstalled,
    isDismissed,
    canShowPrompt,
    promptInstall,
    dismiss,
    isIOS: deviceInfo.isIOS,
    isAndroid: deviceInfo.isAndroid,
    hasNativePrompt: !!deferredPrompt,
  };
};
