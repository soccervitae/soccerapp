import { Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OfflineCacheIndicatorProps {
  lastUpdated: string | null;
}

export const OfflineCacheIndicator = ({ lastUpdated }: OfflineCacheIndicatorProps) => {
  const formattedTime = lastUpdated
    ? formatDistanceToNow(new Date(lastUpdated), { addSuffix: true, locale: ptBR })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-amber-100 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2"
    >
      <div className="flex items-center justify-center gap-2 text-amber-800 dark:text-amber-200 text-sm">
        <Database className="h-4 w-4" />
        <span>Exibindo posts salvos</span>
        {formattedTime && (
          <span className="text-xs opacity-75">
            (atualizados {formattedTime})
          </span>
        )}
      </div>
    </motion.div>
  );
};
