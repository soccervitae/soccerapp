interface Championship {
  id: string;
  year: number;
  team_name: string | null;
  position_achieved: string | null;
  games_played: number | null;
  goals_scored: number | null;
  custom_championship_name: string | null;
  championship: {
    name: string;
    logo_url: string | null;
  } | null;
}

interface ChampionshipsTabProps {
  championships: Championship[];
  isLoading?: boolean;
}

export const ChampionshipsTab = ({ championships, isLoading = false }: ChampionshipsTabProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3 px-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted rounded-xl p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="w-12 h-12 bg-muted-foreground/20 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted-foreground/20 rounded" />
                <div className="h-3 w-24 bg-muted-foreground/20 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (championships.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <span className="material-symbols-outlined text-[48px] text-muted-foreground/50">emoji_events</span>
        <p className="text-muted-foreground text-sm mt-2">Nenhum campeonato ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-1 pb-8">
      {championships.map((champ) => {
        const champName = champ.championship?.name || champ.custom_championship_name || "Campeonato";
        
        return (
          <div 
            key={champ.id} 
            className="bg-card border border-border rounded-xl p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex gap-3">
              {/* Logo */}
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                {champ.championship?.logo_url ? (
                  <img 
                    src={champ.championship.logo_url} 
                    alt={champName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="material-symbols-outlined text-[24px] text-muted-foreground">emoji_events</span>
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{champName}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{champ.year}</span>
                  {champ.team_name && (
                    <>
                      <span>•</span>
                      <span className="truncate">{champ.team_name}</span>
                    </>
                  )}
                </div>
                
                {/* Stats */}
                <div className="flex gap-4 mt-2">
                  {champ.position_achieved && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="material-symbols-outlined text-[14px] text-primary">military_tech</span>
                      <span className="text-foreground">{champ.position_achieved}</span>
                    </div>
                  )}
                  {champ.games_played !== null && champ.games_played > 0 && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="material-symbols-outlined text-[14px] text-muted-foreground">sports_soccer</span>
                      <span className="text-muted-foreground">{champ.games_played} jogos</span>
                    </div>
                  )}
                  {champ.goals_scored !== null && champ.goals_scored > 0 && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="material-symbols-outlined text-[14px] text-muted-foreground">target</span>
                      <span className="text-muted-foreground">{champ.goals_scored} gols</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
