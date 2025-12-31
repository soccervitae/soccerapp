import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface GoalAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
}

const CONFETTI_COLORS = [
  "bg-green-500",
  "bg-yellow-400", 
  "bg-primary",
  "bg-amber-500",
  "bg-emerald-400",
  "bg-lime-400",
];

const CONFETTI_COUNT = 30;

export const GoalAnimation = ({ isVisible, onComplete }: GoalAnimationProps) => {
  // Generate random confetti pieces
  const confetti = useMemo(() => {
    return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 100 - 50, // -50 to 50
      delay: Math.random() * 0.3,
      duration: 0.8 + Math.random() * 0.4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      size: 8 + Math.random() * 8,
    }));
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Confetti particles */}
          {confetti.map((piece) => (
            <motion.div
              key={piece.id}
              className={`absolute w-3 h-3 ${piece.color} rounded-sm`}
              style={{ 
                width: piece.size, 
                height: piece.size * 0.6,
              }}
              initial={{
                x: 0,
                y: 0,
                opacity: 0,
                rotate: 0,
                scale: 0,
              }}
              animate={{
                x: [0, piece.x * 4, piece.x * 6],
                y: [0, -150, 300],
                opacity: [0, 1, 1, 0],
                rotate: [0, piece.rotation, piece.rotation * 2],
                scale: [0, 1, 1, 0.5],
              }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: "easeOut",
              }}
            />
          ))}

          {/* Goal emoji bouncing */}
          <motion.div
            className="text-8xl"
            initial={{ scale: 0, y: 50 }}
            animate={{ 
              scale: [0, 1.4, 1.2, 1.3, 1.2],
              y: [50, 0, -20, 0, -10, 0],
            }}
            transition={{ 
              duration: 0.6,
              ease: "easeOut",
            }}
          >
            <motion.span
              animate={{ opacity: 0 }}
              transition={{ delay: 1, duration: 0.3 }}
              onAnimationComplete={onComplete}
            >
              🥅
            </motion.span>
          </motion.div>

          {/* Soccer ball flying into goal */}
          <motion.div
            className="absolute text-5xl"
            initial={{ x: -200, y: 100, scale: 0.5, opacity: 0 }}
            animate={{
              x: [-200, 0],
              y: [100, 0],
              scale: [0.5, 1, 0.8],
              opacity: [0, 1, 0],
              rotate: [0, 360, 720],
            }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
            }}
          >
            ⚽
          </motion.div>

          {/* "GOOOL!" text */}
          <motion.div
            className="absolute text-4xl font-black text-primary drop-shadow-lg tracking-wider"
            style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}
            initial={{ scale: 0, opacity: 0, y: 60 }}
            animate={{ 
              scale: [0, 1.5, 1.2],
              opacity: [0, 1, 1],
              y: [60, 60, 60],
            }}
            transition={{ 
              delay: 0.3,
              duration: 0.4,
              ease: "backOut",
            }}
          >
            <motion.span
              animate={{ 
                scale: [1, 1.1, 1],
              }}
              transition={{
                delay: 0.7,
                duration: 0.3,
                repeat: 1,
              }}
            >
              <motion.span
                animate={{ opacity: 0 }}
                transition={{ delay: 1.1, duration: 0.2 }}
              >
                GOOOL!
              </motion.span>
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
