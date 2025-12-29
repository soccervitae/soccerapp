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
      {/* Left hand - angled up-right */}
      {/* Wrist/palm base */}
      <path d="M5 18 L4 16 C3 14 3.5 12 5 10.5" />
      {/* Thumb */}
      <path d="M5 10.5 L4.5 9 C4 8 4.5 7 5.5 6.5 L7 6" />
      {/* Index finger */}
      <path d="M7 6 L6 4 C5.5 3 6 2 7 1.5 L8.5 1.5" />
      {/* Middle finger */}
      <path d="M8.5 1.5 L9.5 3.5" />
      {/* Palm curve */}
      <path d="M5 10.5 L8 8 L10 10" />
      {/* Arm */}
      <path d="M5 18 L4 21 C3.5 22.5 4.5 23 6 22.5" />
      
      {/* Right hand - angled up-left */}
      {/* Wrist/palm base */}
      <path d="M19 18 L20 16 C21 14 20.5 12 19 10.5" />
      {/* Thumb */}
      <path d="M19 10.5 L19.5 9 C20 8 19.5 7 18.5 6.5 L17 6" />
      {/* Index finger */}
      <path d="M17 6 L18 4 C18.5 3 18 2 17 1.5 L15.5 1.5" />
      {/* Middle finger */}
      <path d="M15.5 1.5 L14.5 3.5" />
      {/* Palm curve */}
      <path d="M19 10.5 L16 8 L14 10" />
      {/* Arm */}
      <path d="M19 18 L20 21 C20.5 22.5 19.5 23 18 22.5" />
      
      {/* Hands meeting/clapping */}
      <path d="M10 10 L12 12 L14 10" />
      <path d="M8 14 L12 17 L16 14" />
    </svg>
  );
};
