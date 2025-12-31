import { motion, AnimatePresence } from "framer-motion";

interface RefetchOverlayProps {
  isRefetching: boolean;
}

export const RefetchOverlay = ({ isRefetching }: RefetchOverlayProps) => {
  return (
    <AnimatePresence>
      {isRefetching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-background/95 backdrop-blur-md border border-border rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="material-symbols-outlined text-primary text-lg"
            >
              progress_activity
            </motion.span>
            <span className="text-sm text-foreground">Atualizando...</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
