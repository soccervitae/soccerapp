export const FeedHeader = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
      <h1 className="text-xl font-bold text-foreground tracking-tight">Feed</h1>
      <div className="flex items-center gap-2">
        <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-foreground transition-colors">
          <span className="material-symbols-outlined text-[24px]">favorite</span>
        </button>
        <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-foreground transition-colors relative">
          <span className="material-symbols-outlined text-[24px]">chat</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </button>
      </div>
    </div>
  );
};
