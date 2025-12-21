import { WifiOff, RefreshCw, CloudOff } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';

export const OfflineIndicator = () => {
  const { isOnline, syncing, pendingCount } = useOfflineSync();

  if (isOnline && !syncing && pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 text-sm rounded-lg',
        !isOnline
          ? 'bg-destructive/10 text-destructive'
          : 'bg-warning/10 text-warning'
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Modo offline</span>
          {pendingCount > 0 && (
            <span className="ml-auto flex items-center gap-1">
              <CloudOff className="h-3 w-3" />
              {pendingCount} pendente(s)
            </span>
          )}
        </>
      ) : syncing ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Sincronizando {pendingCount} mensagem(s)...</span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <CloudOff className="h-4 w-4" />
          <span>{pendingCount} mensagem(s) pendente(s)</span>
        </>
      ) : null}
    </div>
  );
};
