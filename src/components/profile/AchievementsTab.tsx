interface Achievement {
  id: string;
  year: number;
  team_name: string | null;
  championship_name: string | null;
  custom_achievement_name: string | null;
  description: string | null;
  achievement_type: {
    name: string;
    icon: string;
    color: string | null;
    category: string | null;
  } | null;
}

interface AchievementsTabProps {
  achievements: Achievement[];
  isLoading?: boolean;
}

const getColorClasses = (color: string | null) => {
  switch (color) {
    case "gold":
      return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
    case "silver":
      return "bg-gray-400/20 text-gray-400 border-gray-400/30";
    case "bronze":
      return "bg-orange-600/20 text-orange-600 border-orange-600/30";
    case "blue":
      return "bg-blue-500/20 text-blue-500 border-blue-500/30";
    case "green":
      return "bg-green-500/20 text-green-500 border-green-500/30";
    case "purple":
      return "bg-purple-500/20 text-purple-500 border-purple-500/30";
    default:
      return "bg-primary/20 text-primary border-primary/30";
  }
};

export const AchievementsTab = ({ achievements, isLoading = false }: AchievementsTabProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3 px-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted rounded-xl p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="w-12 h-12 bg-muted-foreground/20 rounded-full" />
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

  if (achievements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <span className="material-symbols-outlined text-[48px] text-muted-foreground/50">military_tech</span>
        <p className="text-muted-foreground text-sm mt-2">Nenhuma conquista ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-1 pb-8">
      {achievements.map((achievement) => {
        const achievementName = achievement.achievement_type?.name || achievement.custom_achievement_name || "Conquista";
        const colorClasses = getColorClasses(achievement.achievement_type?.color);
        
        return (
          <div 
            key={achievement.id} 
            className="bg-card border border-border rounded-xl p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex gap-3">
              {/* Icon */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border ${colorClasses}`}>
                <span className="material-symbols-outlined text-[24px]">
                  {achievement.achievement_type?.icon || "emoji_events"}
                </span>
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground truncate">{achievementName}</h3>
                  {achievement.achievement_type?.category && (
                    <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                      {achievement.achievement_type.category}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span>{achievement.year}</span>
                  {achievement.championship_name && (
                    <>
                      <span>•</span>
                      <span className="truncate">{achievement.championship_name}</span>
                    </>
                  )}
                  {achievement.team_name && (
                    <>
                      <span>•</span>
                      <span className="truncate">{achievement.team_name}</span>
                    </>
                  )}
                </div>
                
                {achievement.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {achievement.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
