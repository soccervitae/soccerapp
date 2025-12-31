import { motion, AnimatePresence } from "framer-motion";

interface RedCardAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
}

export const RedCardAnimation = ({ isVisible, onComplete }: RedCardAnimationProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Red card emoji flying up and out */}
          <motion.div
            className="text-8xl"
            initial={{ 
              scale: 0.5, 
              opacity: 0,
              y: 100,
              rotate: -15
            }}
            animate={{ 
              scale: [0.5, 1.5, 1.2],
              opacity: [0, 1, 1],
              y: [100, 0, 0],
              rotate: [-15, 10, 0]
            }}
            transition={{ 
              duration: 0.4,
              ease: "easeOut"
            }}
          >
            <motion.span
              animate={{
                y: [-0, -300],
                x: [0, 150],
                rotate: [0, 45],
                opacity: [1, 0],
                scale: [1.2, 0.3]
              }}
              transition={{
                delay: 0.5,
                duration: 0.6,
                ease: [0.4, 0, 1, 1]
              }}
              onAnimationComplete={onComplete}
            >
              🟥
            </motion.span>
          </motion.div>
          
          {/* "EXPULSO!" text */}
          <motion.div
            className="absolute text-3xl font-black text-destructive drop-shadow-lg"
            initial={{ scale: 0, opacity: 0, rotate: -10 }}
            animate={{ 
              scale: [0, 1.3, 1],
              opacity: [0, 1, 1],
              rotate: [-10, 5, 0]
            }}
            transition={{ 
              delay: 0.2,
              duration: 0.4,
              ease: "backOut"
            }}
          >
            <motion.span
              animate={{ opacity: 0 }}
              transition={{ delay: 0.9, duration: 0.2 }}
            >
              EXPULSO!
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
