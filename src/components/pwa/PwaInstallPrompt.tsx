import { usePwaInstall } from "@/hooks/usePwaInstall";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PwaInstallPrompt = () => {
  const { canShowPrompt, promptInstall, dismiss, isIOS, hasNativePrompt } = usePwaInstall();

  if (!canShowPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed bottom-0 left-0 right-0 z-[100] bg-gradient-to-r from-primary via-primary/95 to-emerald-600 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]"
      >
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex h-10 w-10 rounded-full bg-primary-foreground/20 items-center justify-center shrink-0">
                <Smartphone className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h3 className="text-primary-foreground font-semibold text-sm truncate">
                  Instale o SOCCER VITAE
                </h3>
                {isIOS ? (
                  <p className="text-primary-foreground/80 text-xs truncate">
                    Acesse mais rápido direto da sua tela inicial
                  </p>
                ) : (
                  <p className="text-primary-foreground/80 text-xs truncate">
                    Acesse mais rápido direto da sua tela inicial
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={isIOS ? undefined : promptInstall}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-1.5"
              >
                <Download className="h-4 w-4" />
                <span>Instalar</span>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={dismiss}
                className="h-8 w-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PwaInstallPrompt;
