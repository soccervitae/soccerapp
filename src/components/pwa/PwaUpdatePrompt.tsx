import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaUpdate } from "@/hooks/usePwaUpdate";

const PwaUpdatePrompt = () => {
  const { showUpdatePrompt, updateApp, dismissUpdate } = usePwaUpdate();

  return (
    <AnimatePresence>
      {showUpdatePrompt && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[100] p-3 pt-[env(safe-area-inset-top)]"
        >
          <div className="mx-auto max-w-md bg-primary rounded-xl shadow-lg p-4 flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-primary-foreground animate-spin" />
            <div className="flex-1">
              <p className="text-primary-foreground font-medium text-sm">
                Nova versão disponível!
              </p>
              <p className="text-primary-foreground/80 text-xs">
                Atualize agora para ter as últimas melhorias
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={updateApp}
              className="bg-background text-foreground hover:bg-background/90"
            >
              Atualizar
            </Button>
            <button 
              onClick={dismissUpdate} 
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PwaUpdatePrompt;
