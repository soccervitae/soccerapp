import { useState, useRef, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ArrowDown } from "lucide-react";

interface RefreshableContainerProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
  threshold?: number;
  className?: string;
}

export const RefreshableContainer = ({
  children,
  onRefresh,
  isRefreshing = false,
  threshold = 80,
  className = "",
}: RefreshableContainerProps) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const hasVibrated = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
      hasVibrated.current = false;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling) return;
    
    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    
    // Apply resistance to pull
    const resistedDistance = Math.min(distance * 0.5, threshold * 1.5);
    setPullDistance(resistedDistance);

    // Vibrate when threshold is reached (once per pull)
    if (resistedDistance >= threshold && !hasVibrated.current && navigator.vibrate) {
      navigator.vibrate(10);
      hasVibrated.current = true;
    }
  }, [isPulling, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      await onRefresh();
    }
    
    setIsPulling(false);
    setPullDistance(0);
    startY.current = 0;
    currentY.current = 0;
    hasVibrated.current = false;
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: 1, 
              height: isRefreshing ? 48 : pullDistance,
            }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center overflow-hidden"
          >
            {isRefreshing ? (
              <RefreshCw className="h-5 w-5 text-primary animate-spin" />
            ) : (
              <ArrowDown 
                className="h-5 w-5 text-primary transition-transform"
                style={{ 
                  opacity: Math.min(progress, 1),
                  transform: `scale(${0.5 + progress * 0.5}) rotate(${progress >= 1 ? 180 : 0}deg)`,
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content with transform during pull */}
      <motion.div
        animate={{ 
          y: isPulling && !isRefreshing ? pullDistance * 0.3 : 0 
        }}
        transition={{ duration: 0.1 }}
      >
        {children}
      </motion.div>
    </div>
  );
};
