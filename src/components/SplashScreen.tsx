import { motion } from "framer-motion";

const SplashScreen = () => {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-primary"
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
          ease: [0.34, 1.56, 0.64, 1], // Spring-like bounce
        }}
        className="mb-6"
      >
        <div className="relative">
          {/* Círculo de fundo com glow */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="absolute inset-0 rounded-full bg-primary-foreground/20 blur-xl scale-150"
          />
          {/* Ícone de bola */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 2, 
              ease: "linear", 
              repeat: Infinity,
              repeatDelay: 1
            }}
            className="relative w-24 h-24 flex items-center justify-center"
          >
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full text-primary-foreground"
              fill="currentColor"
            >
              <circle cx="50" cy="50" r="45" fill="currentColor" />
              <path
                d="M50 5 L50 15 M50 85 L50 95 M5 50 L15 50 M85 50 L95 50"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="50" cy="50" r="30" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
              <path
                d="M50 20 L35 35 L35 65 L50 80 L65 65 L65 35 Z"
                fill="hsl(var(--primary))"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
              />
            </svg>
          </motion.div>
        </div>
      </motion.div>

      {/* Texto principal */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-3xl font-display font-bold text-primary-foreground tracking-wider mb-2"
      >
        SOCCER VITAE
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="text-primary-foreground/80 text-sm font-display"
      >
        A maior rede de atletas
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
            className="w-2 h-2 rounded-full bg-primary-foreground/60"
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
