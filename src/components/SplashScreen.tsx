import { motion } from "framer-motion";
import soccerVitaeLogo from "@/assets/soccer-vitae-logo.png";

const SplashScreen = () => {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ backgroundColor: "#426F42" }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {/* Logo animado */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.6,
          ease: [0.34, 1.56, 0.64, 1],
        }}
        className="mb-6"
      >
        <div className="relative">
          {/* Glow effect */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="absolute inset-0 blur-2xl scale-150"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
          />
          {/* Logo */}
          <motion.img
            src={soccerVitaeLogo}
            alt="Soccer Vitae"
            className="relative w-48 h-auto drop-shadow-2xl"
            animate={{ 
              y: [0, -8, 0],
            }}
            transition={{ 
              duration: 2, 
              ease: "easeInOut", 
              repeat: Infinity,
            }}
          />
        </div>
      </motion.div>

      {/* Texto principal */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-3xl font-display font-bold text-white tracking-wider mb-2"
      >
        SOCCER VITAE
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="text-white/80 text-sm font-display text-center px-4"
      >
        Onde talentos encontram oportunidades
      </motion.p>

      {/* Loading indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
        className="absolute bottom-16 flex gap-2"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-white/60"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
