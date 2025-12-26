import { useState, useCallback } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export const usePwaUpdate = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Verificar atualizações periodicamente (a cada 1 hora)
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
    onNeedRefresh() {
      setShowUpdatePrompt(true);
    },
  });

  const updateApp = useCallback(async () => {
    await updateServiceWorker(true);
    setShowUpdatePrompt(false);
  }, [updateServiceWorker]);

  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
    setShowUpdatePrompt(false);
  }, [setNeedRefresh]);

  return {
    showUpdatePrompt,
    needRefresh,
    updateApp,
    dismissUpdate,
  };
};
