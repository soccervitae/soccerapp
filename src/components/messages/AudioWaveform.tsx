import { useMemo } from "react";
import { motion } from "framer-motion";

interface AudioWaveformProps {
  isPlaying: boolean;
  progress: number; // 0-100
  barCount?: number;
  seed?: string; // Para gerar alturas consistentes
  isOwn: boolean;
  onSeek?: (progress: number) => void;
}

export const AudioWaveform = ({
  isPlaying,
  progress,
  barCount = 28,
  seed = "",
  isOwn,
  onSeek,
}: AudioWaveformProps) => {
  // Gerar alturas pseudo-aleatórias baseadas no seed (ID da mensagem)
  const barHeights = useMemo(() => {
    const heights: number[] = [];
    for (let i = 0; i < barCount; i++) {
      const charCode = seed.charCodeAt(i % seed.length) || 65;
      const noise = Math.sin(charCode * (i + 1) * 0.5) * 0.5 + 0.5;
      // Criar padrão mais orgânico com variação
      const wave = Math.sin((i / barCount) * Math.PI * 2) * 0.2;
      heights.push(0.25 + (noise + wave) * 0.75);
    }
    return heights;
  }, [seed, barCount]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = (clickX / rect.width) * 100;
    onSeek(Math.max(0, Math.min(100, newProgress)));
  };

  return (
    <div 
      className="flex items-center gap-[2px] h-7 cursor-pointer"
      onClick={handleClick}
    >
      {barHeights.map((height, index) => {
        const barProgress = ((index + 1) / barCount) * 100;
        const isFilled = barProgress <= progress;
        
        return (
          <motion.div
            key={index}
            className={`w-[3px] rounded-full transition-colors duration-150 ${
              isFilled
                ? isOwn 
                  ? "bg-slate-600 dark:bg-slate-200"
                  : "bg-primary"
                : isOwn
                  ? "bg-slate-300 dark:bg-slate-500"
                  : "bg-muted-foreground/30"
            }`}
            style={{ height: `${height * 100}%` }}
            animate={isPlaying ? {
              scaleY: [1, 1.15 + Math.random() * 0.15, 0.9, 1.1, 1],
            } : { scaleY: 1 }}
            transition={isPlaying ? {
              duration: 0.4 + Math.random() * 0.2,
              repeat: Infinity,
              delay: index * 0.015,
              ease: "easeInOut",
            } : { duration: 0.2 }}
          />
        );
      })}
    </div>
  );
};
