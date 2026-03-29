import { Users } from "lucide-react";

interface SquadTabProps {
  userId?: string;
  isOwnProfile?: boolean;
}

export const SquadTab = ({ userId, isOwnProfile }: SquadTabProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground px-4">
      <div className="w-20 h-20 rounded-full bg-muted/60 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-[40px]">groups</span>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">Elenco</h3>
      <p className="text-sm text-center max-w-xs">
        {isOwnProfile 
          ? "Em breve você poderá adicionar atletas ao seu elenco."
          : "Nenhum atleta vinculado ao elenco ainda."
        }
      </p>
    </div>
  );
};
