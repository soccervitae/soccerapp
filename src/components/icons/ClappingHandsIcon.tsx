import { forwardRef, SVGProps } from "react";

interface ClappingHandsIconProps extends SVGProps<SVGSVGElement> {
  filled?: boolean;
}

export const ClappingHandsIcon = forwardRef<SVGSVGElement, ClappingHandsIconProps>(
  ({ className = "", filled = false, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        viewBox="0 0 24 24"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        {/* Left hand */}
        <path d="M7 20c-1.5-1.5-3-4-3.5-6.5-.4-2 .3-3.5 1.8-4.2l.7-.3c-.3-1.2-.1-2.3.6-3 .8-.8 2-.8 2.8 0l1 1.2" />
        <path d="M8.5 7c-.3-1 .1-2 1-2.5.9-.4 2-.1 2.5.8l.8 1.5" />
        <path d="M12.5 6.5c.2-1 1-1.7 2-1.5 1 .2 1.6 1 1.4 2l-.4 1.5" />
        
        {/* Right hand */}
        <path d="M17 20c1.5-1.5 3-4 3.5-6.5.4-2-.3-3.5-1.8-4.2l-.7-.3c.3-1.2.1-2.3-.6-3-.8-.8-2-.8-2.8 0l-1 1.2" />
        
        {/* Fingers connection */}
        <path d="M9.5 12c.8.8 2.2 1 3.5.8 1.3-.2 2.3-.8 3-1.5" />
        <path d="M8 15c1.2 1 3 1.5 4.5 1.2 1.5-.3 2.8-1.2 3.5-2.2" />
        
        {/* Impact lines */}
        <line x1="3" y1="6" x2="5" y2="7.5" />
        <line x1="2" y1="10" x2="4.5" y2="10.5" />
        <line x1="21" y1="6" x2="19" y2="7.5" />
        <line x1="22" y1="10" x2="19.5" y2="10.5" />
        <line x1="11" y1="2" x2="11.5" y2="4" />
        <line x1="13" y1="2" x2="12.5" y2="4" />
      </svg>
    );
  }
);

ClappingHandsIcon.displayName = "ClappingHandsIcon";
