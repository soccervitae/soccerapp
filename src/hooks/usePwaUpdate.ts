import { useRegisterSW } from "virtual:pwa-register/react";

export const usePwaUpdate = () => {
  const { updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      registration.update();
      window.setInterval(() => {
        registration.update();
      }, 5 * 60 * 1000);
    },
    async onNeedRefresh() {
      if (!("serviceWorker" in navigator)) {
        window.location.reload();
        return;
      }

      const handleControllerChange = () => {
        navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
        window.location.reload();
      };

      navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
      await updateServiceWorker(true);
    },
  });
};
