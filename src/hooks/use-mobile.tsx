import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      // Only use width for mobile detection - no height-based landscape heuristic
      // which causes false positives in embedded previews and short desktop windows
      setIsMobile(width < MOBILE_BREAKPOINT);
    };
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => checkMobile();
    mql.addEventListener("change", onChange);
    window.addEventListener("resize", checkMobile);
    checkMobile();
    return () => {
      mql.removeEventListener("change", onChange);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  return !!isMobile;
}
