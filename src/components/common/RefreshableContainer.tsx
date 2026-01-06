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
  const isEligiblePull = useRef(false);

  const MIN_PULL_START_PX = 12;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;

    // Don't hijack taps on interactive elements (e.g. profile post thumbnails / feed media).
    if (target?.closest("button,a,input,textarea,select,[role='button'],[data-no-pull='true']")) {
      isEligiblePull.current = false;
      return;
    }

    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      currentY.current = startY.current;
      isEligiblePull.current = true;
      setIsPulling(false);
      setPullDistance(0);
      hasVibrated.current = false;
    } else {
      isEligiblePull.current = false;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isEligiblePull.current) return;

      currentY.current = e.touches[0].clientY;
      const rawDistance = currentY.current - startY.current;

      // Only start pull-to-refresh after a small intentional downward drag.
      if (rawDistance < MIN_PULL_START_PX && !isPulling) return;

      if (!isPulling) setIsPulling(true);

      const distance = Math.max(0, rawDistance - MIN_PULL_START_PX);

      // Prevent scroll bounce only when we're actively pulling.
      if (distance > 0) e.preventDefault();

      // Apply resistance to pull
      const resistedDistance = Math.min(distance * 0.5, threshold * 1.5);
      setPullDistance(resistedDistance);

      // Vibrate when threshold is reached (once per pull)
      if (resistedDistance >= threshold && !hasVibrated.current && navigator.vibrate) {
        navigator.vibrate(10);
        hasVibrated.current = true;
      }
    },
    [isPulling, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      await onRefresh();
    }

    isEligiblePull.current = false;
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

      {/* Content - only animate when actively pulling */}
      {isPulling && !isRefreshing && pullDistance > 0 ? (
        <motion.div
          animate={{ y: pullDistance * 0.3 }}
          transition={{ duration: 0.1 }}
        >
          {children}
        </motion.div>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
};
