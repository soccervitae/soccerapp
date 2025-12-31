import { forwardRef, ImgHTMLAttributes } from "react";
import clappingInactive from "@/assets/clapping-inactive.png";
import clappingActive from "@/assets/clapping-active.png";

interface ClappingHandsIconProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  filled?: boolean;
}

export const ClappingHandsIcon = forwardRef<HTMLImageElement, ClappingHandsIconProps>(
  ({ className = "", filled = false, ...props }, ref) => {
    return (
      <img
        ref={ref}
        src={filled ? clappingActive : clappingInactive}
        alt="Aplausos"
        className={className}
        {...props}
      />
    );
  }
);

ClappingHandsIcon.displayName = "ClappingHandsIcon";
