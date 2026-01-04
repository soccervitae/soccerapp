import { useState, useEffect } from "react";

export const useRequirePwa = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = /Mobi|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    setIsMobile(checkMobile);

    // Detect PWA mode (reliable signals only)
    const checkPWA =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsPWA(checkPWA);

    setIsLoading(false);
  }, []);

  return {
    shouldBlockAccess: isMobile && !isPWA,
    isMobile,
    isPWA,
    isLoading,
  };
};
