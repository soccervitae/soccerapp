import { type Profile } from "@/hooks/useProfile";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AboutTabProps {
  profile: Profile;
}

export const AboutTab = ({ profile }: AboutTabProps) => {
  const createdAt = profile.created_at ? format(new Date(profile.created_at), "MMMM 'de' yyyy", { locale: ptBR }) : null;

  return (
    <div className="flex flex-col gap-3 px-4 py-2">
      {/* Bio */}
      {profile.bio && (
        <div className="bg-card rounded-xl p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[20px] text-muted-foreground">description</span>
            <h4 className="font-semibold text-sm text-foreground">Sobre</h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{profile.bio}</p>
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {profile.full_name && (
          <div className="bg-card rounded-xl p-4 border border-border/50 flex items-center gap-3">
            <span className="material-symbols-outlined text-[22px] text-primary">badge</span>
            <div>
              <p className="text-xs text-muted-foreground">Nome</p>
              <p className="text-sm font-semibold text-foreground">{profile.full_name}</p>
            </div>
          </div>
        )}

        <div className="bg-card rounded-xl p-4 border border-border/50 flex items-center gap-3">
          <span className="material-symbols-outlined text-[22px] text-primary">alternate_email</span>
          <div>
            <p className="text-xs text-muted-foreground">Usuário</p>
            <p className="text-sm font-semibold text-foreground">@{profile.username}</p>
          </div>
        </div>

        {createdAt && (
          <div className="bg-card rounded-xl p-4 border border-border/50 flex items-center gap-3">
            <span className="material-symbols-outlined text-[22px] text-primary">calendar_month</span>
            <div>
              <p className="text-xs text-muted-foreground">Membro desde</p>
              <p className="text-sm font-semibold text-foreground capitalize">{createdAt}</p>
            </div>
          </div>
        )}

        {profile.account_type === 'time' && (
          <div className="bg-card rounded-xl p-4 border border-border/50 flex items-center gap-3">
            <span className="material-symbols-outlined text-[22px] text-primary">shield</span>
            <div>
              <p className="text-xs text-muted-foreground">Tipo de conta</p>
              <p className="text-sm font-semibold text-foreground">Time de Futebol</p>
            </div>
          </div>
        )}

        {(profile as any).foundation_year && (
          <div className="bg-card rounded-xl p-4 border border-border/50 flex items-center gap-3">
            <span className="material-symbols-outlined text-[22px] text-primary">event</span>
            <div>
              <p className="text-xs text-muted-foreground">Ano de Fundação</p>
              <p className="text-sm font-semibold text-foreground">{(profile as any).foundation_year}</p>
            </div>
          </div>
        )}

        {(profile as any).city && (
          <div className="bg-card rounded-xl p-4 border border-border/50 flex items-center gap-3">
            <span className="material-symbols-outlined text-[22px] text-primary">location_city</span>
            <div>
              <p className="text-xs text-muted-foreground">Cidade</p>
              <p className="text-sm font-semibold text-foreground">{(profile as any).city}</p>
            </div>
          </div>
        )}

        {(profile as any).team_category && (
          <div className="bg-card rounded-xl p-4 border border-border/50 flex items-center gap-3">
            <span className="material-symbols-outlined text-[22px] text-primary">category</span>
            <div>
              <p className="text-xs text-muted-foreground">Categoria</p>
              <p className="text-sm font-semibold text-foreground capitalize">{(profile as any).team_category}</p>
            </div>
          </div>
        )}
      </div>

      {/* Empty state if no info */}
      {!profile.bio && !profile.full_name && !createdAt && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <span className="material-symbols-outlined text-[48px] mb-2">info</span>
          <p className="text-sm">Nenhuma informação disponível</p>
        </div>
      )}
    </div>
  );
};
