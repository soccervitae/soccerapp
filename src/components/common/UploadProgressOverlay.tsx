import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UploadProgressOverlayProps {
  isVisible: boolean;
  current: number;
  total: number;
  label?: string;
}

export const UploadProgressOverlay = ({
  isVisible,
  current,
  total,
  label = "Enviando mídias..."
}: UploadProgressOverlayProps) => {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card border border-border rounded-2xl p-6 shadow-xl max-w-xs w-full mx-4"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
              
              <div className="text-center">
                <p className="font-medium text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {current} de {total} {total === 1 ? 'arquivo' : 'arquivos'}
                </p>
              </div>

              <div className="w-full space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {Math.round(progress)}%
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
