import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export const GlobalOfflineBanner = () => {
  const { isOnline, pendingCount } = useOfflineSync();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground py-3 px-4 shadow-lg"
        >
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <WifiOff className="h-4 w-4" />
            <span>Você está sem conexão com a internet</span>
          </div>
          {pendingCount > 0 && (
            <p className="text-center text-xs opacity-90 mt-1">
              {pendingCount} mensagem(s) serão enviadas quando voltar online
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
