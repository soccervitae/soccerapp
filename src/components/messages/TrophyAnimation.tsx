import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface TrophyAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
}

const SPARKLE_COUNT = 12;

export const TrophyAnimation = ({ isVisible, onComplete }: TrophyAnimationProps) => {
  // Generate sparkles around the trophy
  const sparkles = useMemo(() => {
    return Array.from({ length: SPARKLE_COUNT }, (_, i) => {
      const angle = (i / SPARKLE_COUNT) * 360;
      const distance = 60 + Math.random() * 40;
      return {
        id: i,
        x: Math.cos((angle * Math.PI) / 180) * distance,
        y: Math.sin((angle * Math.PI) / 180) * distance,
        delay: Math.random() * 0.3,
        size: 12 + Math.random() * 10,
      };
    });
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
          {/* Golden glow background */}
          <motion.div
            className="absolute w-48 h-48 rounded-full bg-amber-400/30 blur-3xl"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.5, 1.2],
              opacity: [0, 0.6, 0],
            }}
            transition={{ duration: 1.2 }}
          />

          {/* Sparkles */}
          {sparkles.map((sparkle) => (
            <motion.div
              key={sparkle.id}
              className="absolute text-amber-300"
              style={{ fontSize: sparkle.size }}
              initial={{
                x: 0,
                y: 0,
                opacity: 0,
                scale: 0,
              }}
              animate={{
                x: [0, sparkle.x * 0.5, sparkle.x],
                y: [0, sparkle.y * 0.5, sparkle.y],
                opacity: [0, 1, 0],
                scale: [0, 1.2, 0],
              }}
              transition={{
                duration: 0.8,
                delay: 0.2 + sparkle.delay,
                ease: "easeOut",
              }}
            >
              ✦
            </motion.div>
          ))}

          {/* Trophy emoji with shine effect */}
          <motion.div
            className="relative text-8xl"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ 
              scale: [0, 1.3, 1.1, 1.2, 1.1],
              rotate: [-30, 10, -5, 5, 0],
            }}
            transition={{ 
              duration: 0.7,
              ease: "easeOut",
            }}
          >
            {/* Shine overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
              style={{ 
                mixBlendMode: "overlay",
                borderRadius: "50%",
              }}
              initial={{ x: -100, opacity: 0 }}
              animate={{ 
                x: [-100, 100],
                opacity: [0, 1, 0],
              }}
              transition={{
                delay: 0.4,
                duration: 0.6,
                ease: "easeInOut",
              }}
            />
            
            <motion.span
              animate={{ opacity: 0 }}
              transition={{ delay: 1.1, duration: 0.3 }}
              onAnimationComplete={onComplete}
            >
              🏆
            </motion.span>
          </motion.div>

          {/* "CAMPEÃO!" text */}
          <motion.div
            className="absolute text-3xl font-black text-amber-500 drop-shadow-lg"
            style={{ 
              textShadow: "0 0 20px rgba(251, 191, 36, 0.5), 2px 2px 4px rgba(0,0,0,0.3)",
              top: "55%",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.3, 1],
              opacity: [0, 1, 1],
            }}
            transition={{ 
              delay: 0.4,
              duration: 0.4,
              ease: "backOut",
            }}
          >
            <motion.span
              animate={{ 
                textShadow: [
                  "0 0 20px rgba(251, 191, 36, 0.5)",
                  "0 0 40px rgba(251, 191, 36, 0.8)",
                  "0 0 20px rgba(251, 191, 36, 0.5)",
                ],
              }}
              transition={{
                duration: 0.5,
                repeat: 1,
                delay: 0.6,
              }}
            >
              <motion.span
                animate={{ opacity: 0 }}
                transition={{ delay: 1.1, duration: 0.2 }}
              >
                CAMPEÃO!
              </motion.span>
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
