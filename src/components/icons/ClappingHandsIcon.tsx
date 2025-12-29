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
      {/* Left hand */}
      <path d="M4 12.5C4 11 5.5 9.5 7 9.5C7.5 9.5 8 9.7 8.3 10L10 12" />
      <path d="M7 9.5V6C7 4.9 7.9 4 9 4C10.1 4 11 4.9 11 6V10" />
      <path d="M11 6V4.5C11 3.4 11.9 2.5 13 2.5C14.1 2.5 15 3.4 15 4.5V10" />
      
      {/* Right hand */}
      <path d="M20 12.5C20 11 18.5 9.5 17 9.5C16.5 9.5 16 9.7 15.7 10L14 12" />
      <path d="M17 9.5V6C17 4.9 16.1 4 15 4" />
      
      {/* Palms meeting */}
      <path d="M10 12L12 14L14 12" />
      
      {/* Lower arms */}
      <path d="M8 14C6.5 15.5 5 18 5 20" />
      <path d="M16 14C17.5 15.5 19 18 19 20" />
      
      {/* Impact lines */}
      <path d="M12 8V6" strokeWidth="1" />
      <path d="M9 9L7.5 7.5" strokeWidth="1" />
      <path d="M15 9L16.5 7.5" strokeWidth="1" />
    </svg>
  );
};
