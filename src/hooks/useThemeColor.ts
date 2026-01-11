import { useEffect, useCallback, useRef } from "react";

const DEFAULT_THEME_COLOR = "#426F42";

/**
 * Hook to dynamically change the iOS status bar color (theme-color meta tag)
 * Useful for fullscreen media viewers where a dark status bar is needed
 */
export const useThemeColor = (isActive: boolean, color: string = "#000000") => {
  const previousColorRef = useRef<string | null>(null);

  const setThemeColor = useCallback((newColor: string) => {
    const metaTag = document.querySelector('meta[name="theme-color"]');
    if (metaTag) {
      // Store the previous color before changing
      if (previousColorRef.current === null) {
        previousColorRef.current = metaTag.getAttribute("content") || DEFAULT_THEME_COLOR;
      }
      metaTag.setAttribute("content", newColor);
    }
  }, []);

  const resetThemeColor = useCallback(() => {
    const metaTag = document.querySelector('meta[name="theme-color"]');
    if (metaTag) {
      metaTag.setAttribute("content", previousColorRef.current || DEFAULT_THEME_COLOR);
      previousColorRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      setThemeColor(color);
    } else {
      resetThemeColor();
    }

    // Cleanup on unmount
    return () => {
      if (isActive) {
        resetThemeColor();
      }
    };
  }, [isActive, color, setThemeColor, resetThemeColor]);

  return { setThemeColor, resetThemeColor };
};
