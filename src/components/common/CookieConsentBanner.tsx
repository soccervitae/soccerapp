import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const CONSENT_KEY = "cookie_consent";

export const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(CONSENT_KEY, "rejected");
    setVisible(false);
    // Remove AdSense cookies if rejected
    document.cookie.split(";").forEach((c) => {
      const name = c.trim().split("=")[0];
      if (name.startsWith("__g") || name.startsWith("_ga")) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6"
        >
          <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl shadow-2xl p-5 md:p-6">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  🍪 Usamos cookies
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Este site utiliza cookies e tecnologias semelhantes para personalizar anúncios, 
                  fornecer funcionalidades de redes sociais e analisar o tráfego. Ao clicar em 
                  "Aceitar", você concorda com o uso de cookies para fins publicitários conforme 
                  nossa política de privacidade. Você pode recusar cookies não essenciais clicando 
                  em "Recusar".
                </p>
              </div>
              <div className="flex items-center gap-3 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReject}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Recusar
                </Button>
                <Button
                  size="sm"
                  onClick={handleAccept}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-6"
                >
                  Aceitar
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
