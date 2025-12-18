const stats = [
  { label: "Gols", value: 24, change: "+10%", icon: "sports_soccer" },
  { label: "Assistências", value: 12, change: "+5%", icon: "groups" },
  { label: "Jogos", value: 48, change: "+15%", icon: "calendar_month" },
];

export const StatsSection = () => {
  return (
    <section>
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-lg font-bold text-foreground">Estatísticas 23/24</h3>
        <button className="text-emerald-600 text-sm font-semibold hover:underline">Ver tudo</button>
      </div>
      
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 snap-x">
        {stats.map((stat) => (
          <div 
            key={stat.label}
            className="snap-center min-w-[140px] flex-1 bg-card rounded-2xl p-4 border border-border shadow-sm flex flex-col justify-between h-32 relative overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 text-border">
              <span className="material-symbols-outlined text-[80px]">{stat.icon}</span>
            </div>
            <div className="flex items-start justify-between relative z-10">
              <span className="text-muted-foreground font-medium text-sm">{stat.label}</span>
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-xs font-bold">{stat.change}</span>
            </div>
            <p className="text-4xl font-extrabold text-foreground relative z-10">{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
