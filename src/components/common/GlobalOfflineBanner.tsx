import { useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui/button';

export const GlobalOfflineBanner = () => {
  const { isOnline, pendingCount, syncPendingMessages } = useOfflineSync();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    
    // Check if we're actually online now
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        mode: 'no-cors',
        cache: 'no-store',
      });
      
      // If fetch succeeds, we're online - trigger sync
      if (navigator.onLine) {
        await syncPendingMessages();
        // Force a page state update by dispatching online event
        window.dispatchEvent(new Event('online'));
      }
    } catch {
      // Still offline, do nothing
    }
    
    setIsRetrying(false);
  };

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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              disabled={isRetrying}
              className="h-7 px-2 ml-2 text-destructive-foreground hover:bg-destructive-foreground/20"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Verificando...' : 'Tentar novamente'}
            </Button>
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
