import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { type Profile, calculateAge, useFollowUser } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
interface ProfileInfoProps {
  profile: Profile;
  followStats?: {
    followers: number;
    following: number;
    isFollowing: boolean;
  };
  isOwnProfile?: boolean;
}
export const ProfileInfo = ({
  profile,
  followStats,
  isOwnProfile = false
}: ProfileInfoProps) => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const followUser = useFollowUser();
  const [isCheering, setIsCheering] = useState(followStats?.isFollowing || false);
  const handleFollowClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    followUser.mutate({
      userId: profile.id,
      isFollowing: isCheering
    }, {
      onSuccess: () => setIsCheering(!isCheering)
    });
  };
  const age = calculateAge(profile.birth_date);
  const formatHeight = (cm: number | null) => {
    if (!cm) return "-";
    return `${(cm / 100).toFixed(2)}m`;
  };
  const formatWeight = (kg: number | null) => {
    if (!kg) return "-";
    return `${kg}kg`;
  };
  const formatFoot = (foot: string | null) => {
    if (!foot) return "-";
    const footMap: Record<string, string> = {
      right: "Direito",
      left: "Esquerdo",
      both: "Ambos"
    };
    return footMap[foot.toLowerCase()] || foot;
  };
  return <section className="flex flex-col items-center gap-4">
      {/* Cover Photo */}
      <div className="w-full h-32 relative overflow-hidden">
        <img src={profile.cover_url || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=300&fit=crop"} alt="Cover photo" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      {/* Profile Picture */}
      <div className="relative -mt-16 z-10">
        <div className="w-28 h-28 rounded-full p-[3px] bg-gradient-to-tr from-primary to-emerald-600">
          <img src={profile.avatar_url || "/placeholder.svg"} alt={profile.full_name || profile.username} className="w-full h-full rounded-full border-4 border-background bg-muted object-cover" />
        </div>
        {profile.conta_verificada && <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 border-4 border-background flex items-center justify-center">
            <span className="material-symbols-outlined text-[16px] font-bold">verified</span>
          </div>}
      </div>

      {/* Name and Position */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-foreground leading-tight">
          {profile.full_name || profile.username}
        </h2>
        <p className="text-muted-foreground font-medium text-sm">
          {profile.position && profile.team ? `${profile.position} | ${profile.team}` : profile.position || profile.team || `@${profile.username}`}
        </p>
        {profile.bio && <p className="text-muted-foreground text-xs italic px-6 line-clamp-2">{profile.bio}</p>}
      </div>

      {/* Stats Row */}
      {followStats && <div className="flex items-center gap-8 py-2">
          <div className="text-center">
            <p className="text-foreground font-bold">{followStats.followers}</p>
            <p className="text-muted-foreground text-xs">Torcedores</p>
          </div>
          <div className="text-center">
            <p className="text-foreground font-bold">{followStats.following}</p>
            <p className="text-muted-foreground text-xs">Torcendo</p>
          </div>
        </div>}

      {/* Physical Stats */}
      <div className="grid grid-cols-4 gap-2 bg-card rounded-2xl p-3 border border-border shadow-sm w-full mt-2 mx-px px-px">
        <div className="flex flex-col gap-1 p-2 text-center">
          <p className="text-foreground text-sm font-bold">{age || "-"}</p>
          <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Idade</p>
        </div>
        <div className="flex flex-col gap-1 p-2 border-l border-border text-center">
          <p className="text-foreground text-sm font-bold">{formatHeight(profile.height)}</p>
          <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Altura</p>
        </div>
        <div className="flex flex-col gap-1 p-2 border-l border-border text-center">
          <p className="text-foreground text-sm font-bold">{formatWeight(profile.weight ? Number(profile.weight) : null)}</p>
          <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Peso</p>
        </div>
        <div className="flex flex-col gap-1 p-2 border-l border-border text-center">
          <p className="text-foreground text-sm font-bold">{formatFoot(profile.preferred_foot)}</p>
          <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Pé</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex w-full gap-2 mt-2 px-4 sm:max-w-xs">
        {isOwnProfile ? <button onClick={() => navigate("/settings/profile")} className="flex-1 bg-muted hover:bg-muted/80 text-foreground h-9 rounded font-semibold text-xs tracking-wide transition-colors border border-border flex items-center justify-center gap-1.5 shadow-sm">
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Editar Perfil
          </button> : <>
            <button onClick={handleFollowClick} disabled={followUser.isPending} className={`flex-1 h-9 rounded font-semibold text-xs tracking-wide transition-all duration-300 flex items-center justify-center gap-1.5 disabled:opacity-50 ${isCheering ? "bg-primary/10 text-primary border border-primary hover:bg-primary/20" : "bg-primary hover:bg-primary-dark text-primary-foreground shadow-primary-glow"}`}>
              <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${isCheering ? "scale-110" : ""}`} style={{
            fontVariationSettings: isCheering ? "'FILL' 1" : "'FILL' 0"
          }}>
                favorite
              </span>
              {isCheering ? "Torcendo" : "Torcer"}
            </button>
            <button className="flex-1 bg-background hover:bg-muted text-foreground h-9 rounded font-semibold text-xs tracking-wide transition-colors border border-border flex items-center justify-center gap-1.5 shadow-sm">
              <span className="material-symbols-outlined text-[16px]">chat</span>
              Mensagem
            </button>
          </>}
      </div>
    </section>;
};