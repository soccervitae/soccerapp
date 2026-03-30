import { motion } from "framer-motion";

const SoccerAnimation = () => {
  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* Field lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
        <motion.circle
          cx="100" cy="100" r="60"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          fill="none"
          opacity="0.2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "loop", repeatDelay: 1 }}
        />
        <motion.line
          x1="40" y1="100" x2="160" y2="100"
          stroke="hsl(var(--primary))"
          strokeWidth="1"
          opacity="0.15"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatType: "loop", repeatDelay: 1.5 }}
        />
      </svg>

      {/* Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary/40"
          initial={{ 
            x: 0, y: 0, opacity: 0, scale: 0 
          }}
          animate={{ 
            x: Math.cos((i * 60) * Math.PI / 180) * 50,
            y: Math.sin((i * 60) * Math.PI / 180) * 50,
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0]
          }}
          transition={{ 
            duration: 2.5, 
            repeat: Infinity, 
            delay: i * 0.3,
            ease: "easeOut"
          }}
        />
      ))}

      {/* Soccer ball */}
      <motion.div
        className="text-5xl z-10"
        animate={{ 
          y: [0, -24, 0],
          rotate: [0, 360],
        }}
        transition={{ 
          y: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 3, repeat: Infinity, ease: "linear" }
        }}
      >
        ⚽
      </motion.div>

      {/* Shadow */}
      <motion.div
        className="absolute bottom-8 w-10 h-2 rounded-full bg-foreground/10 blur-sm"
        animate={{ 
          scaleX: [1, 0.6, 1],
          opacity: [0.3, 0.15, 0.3]
        }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};

export default SoccerAnimation;
