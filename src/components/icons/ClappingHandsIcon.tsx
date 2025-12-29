interface ClappingHandsIconProps {
  className?: string;
  filled?: boolean;
}

export const ClappingHandsIcon = ({ className = "", filled = false }: ClappingHandsIconProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Left hand (behind) */}
      <path d="M6 14L4.5 12.5C4 12 4 11 4.5 10.5L8 7C8.5 6.5 9.5 6.5 10 7L10.5 7.5" />
      <path d="M10.5 7.5L11 8L8 11L6 14" />
      <path d="M6 14L5 17C4.5 18.5 5 19.5 6 20" />
      
      {/* Right hand (front) */}
      <path d="M18 14L19.5 12.5C20 12 20 11 19.5 10.5L16 7C15.5 6.5 14.5 6.5 14 7L13.5 7.5" />
      <path d="M13.5 7.5L13 8L16 11L18 14" />
      <path d="M18 14L19 17C19.5 18.5 19 19.5 18 20" />
      
      {/* Hands overlap area */}
      <path d="M11 8L12 9L13 8" />
      <path d="M10 11L12 13L14 11" />
      
      {/* Impact lines */}
      <path d="M12 4V2" strokeWidth="1.2" />
      <path d="M9 5L7.5 3.5" strokeWidth="1.2" />
      <path d="M15 5L16.5 3.5" strokeWidth="1.2" />
    </svg>
  );
};
