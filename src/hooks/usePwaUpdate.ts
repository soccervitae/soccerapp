import { useRegisterSW } from "virtual:pwa-register/react";

export const usePwaUpdate = () => {
  useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Verificar atualizações periodicamente (a cada 1 hora)
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
    onNeedRefresh() {
      // Atualização automática - recarrega a página imediatamente
      window.location.reload();
    },
  });
};
