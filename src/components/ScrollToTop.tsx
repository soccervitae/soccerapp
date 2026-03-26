import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll window to top
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    
    // Also scroll any scrollable containers to top
    document.querySelectorAll('[class*="overflow"]').forEach((el) => {
      if (el.scrollTop > 0) {
        el.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
      }
    });
  }, [pathname]);

  return null;
};
