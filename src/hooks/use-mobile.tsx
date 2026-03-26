import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      // Consider mobile if width < 768, OR if in landscape with small height (rotated phone)
      setIsMobile(width < MOBILE_BREAKPOINT || (height < 500 && width < 1024));
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
