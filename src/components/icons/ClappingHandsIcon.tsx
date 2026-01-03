import { forwardRef, ImgHTMLAttributes } from "react";
import clappingInactive from "@/assets/clapping-inactive.png";
import clappingActive from "@/assets/clapping-active.png";
import clappingWhite from "@/assets/clapping-white.png";
import clappingOutline from "@/assets/clapping-outline.png";
import clappingFilledGreen from "@/assets/clapping-filled-green.png";

interface ClappingHandsIconProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  filled?: boolean;
  variant?: 'default' | 'white' | 'green';
}

export const ClappingHandsIcon = forwardRef<HTMLImageElement, ClappingHandsIconProps>(
  ({ className = "", filled = false, variant = 'default', ...props }, ref) => {
    const getIconSrc = () => {
      if (variant === 'green') {
        return filled ? clappingFilledGreen : clappingOutline;
      }
      if (filled) return clappingActive;
      return variant === 'white' ? clappingWhite : clappingInactive;
    };

    return (
      <img
        ref={ref}
        src={getIconSrc()}
        alt="Aplausos"
        className={className}
        {...props}
      />
    );
  }
);

ClappingHandsIcon.displayName = "ClappingHandsIcon";
