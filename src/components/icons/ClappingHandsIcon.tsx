import { forwardRef, SVGProps } from "react";

interface ClappingHandsIconProps extends SVGProps<SVGSVGElement> {
  filled?: boolean;
}

export const ClappingHandsIcon = forwardRef<SVGSVGElement, ClappingHandsIconProps>(
  ({ className = "", filled = false, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        viewBox="0 0 64 64"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        {/* Left hand - palm and fingers */}
        <path d="M22 52 C18 48 14 42 12 36 C10 30 12 26 16 24 L18 22 C16 18 16 14 18 12 C20 10 24 10 26 14 L28 18" />
        <path d="M26 14 C24 10 26 6 30 6 C34 6 36 10 34 14 L32 20" />
        <path d="M34 14 C34 10 38 8 42 10 C44 12 44 16 42 20 L38 26" />
        
        {/* Right hand - overlapping */}
        <path d="M42 52 C46 48 50 42 52 36 C54 30 52 26 48 24 L46 22 C48 18 48 14 46 12 C44 10 40 10 38 14" />
        <path d="M38 14 C40 10 38 6 34 6" />
        
        {/* Hands meeting point */}
        <path d="M28 28 C30 30 34 30 36 28" />
        <path d="M24 34 C28 38 36 38 40 34" />
        
        {/* Wrists/arms */}
        <path d="M22 52 L18 58 C16 60 18 62 22 60" />
        <path d="M42 52 L46 58 C48 60 46 62 42 60" />
        
        {/* Impact lines - left side */}
        <line x1="8" y1="18" x2="14" y2="22" />
        <line x1="4" y1="26" x2="10" y2="28" />
        <line x1="6" y1="34" x2="12" y2="34" />
        
        {/* Impact lines - right side */}
        <line x1="56" y1="18" x2="50" y2="22" />
        <line x1="60" y1="26" x2="54" y2="28" />
        <line x1="58" y1="34" x2="52" y2="34" />
        
        {/* Top impact lines */}
        <line x1="28" y1="2" x2="30" y2="8" />
        <line x1="36" y1="2" x2="34" y2="8" />
        <line x1="32" y1="0" x2="32" y2="6" />
      </svg>
    );
  }
);

ClappingHandsIcon.displayName = "ClappingHandsIcon";
