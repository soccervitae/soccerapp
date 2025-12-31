import { useRegisterSW } from "virtual:pwa-register/react";

export const usePwaUpdate = () => {
  const { updateServiceWorker } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Verificar atualizações periodicamente (a cada 1 hora)
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
    onNeedRefresh() {
      // Atualiza o service worker silenciosamente sem reload
      updateServiceWorker(true);
    },
  });
};
