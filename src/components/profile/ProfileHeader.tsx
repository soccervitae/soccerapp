interface ProfileHeaderProps {
  username: string;
}

export const ProfileHeader = ({ username }: ProfileHeaderProps) => {
  return (
    <header className="fixed top-12 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
      <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-foreground transition-colors">
        <span className="material-symbols-outlined text-[24px]">arrow_back</span>
      </button>
      <h1 className="text-base font-bold text-foreground tracking-wide">{username}</h1>
      <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-foreground transition-colors">
        <span className="material-symbols-outlined text-[24px]">more_horiz</span>
      </button>
    </header>
  );
};
