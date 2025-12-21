import { motion, AnimatePresence } from "framer-motion";

interface TypingIndicatorProps {
  username?: string;
}

export const TypingIndicator = ({ username }: TypingIndicatorProps) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="flex items-center gap-2 px-4 py-2"
      >
        <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1">
            <motion.span
              className="w-2 h-2 bg-muted-foreground/60 rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            />
            <motion.span
              className="w-2 h-2 bg-muted-foreground/60 rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
            />
            <motion.span
              className="w-2 h-2 bg-muted-foreground/60 rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
            />
          </div>
          {username && (
            <span className="text-xs text-muted-foreground ml-1">
              {username} está digitando...
            </span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
