export const BottomNavigation = () => {
  return (
    <nav className="fixed bottom-0 w-full bg-background/95 backdrop-blur-md border-t border-border pb-6 pt-2 z-50">
      <div className="flex justify-around items-center">
        <button className="flex flex-col items-center gap-1 p-2 text-emerald-600">
          <span className="material-symbols-outlined text-[26px] fill-1">person</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-emerald-600 transition-colors">
          <span className="material-symbols-outlined text-[26px]">search</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-emerald-600 transition-colors">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground -mt-4 border-4 border-background shadow-lg shadow-emerald-glow">
            <span className="material-symbols-outlined text-[24px]">add</span>
          </div>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-emerald-600 transition-colors">
          <span className="material-symbols-outlined text-[26px]">analytics</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-emerald-600 transition-colors">
          <span className="material-symbols-outlined text-[26px]">notifications</span>
        </button>
      </div>
    </nav>
  );
};
