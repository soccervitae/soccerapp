import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateConversation } from "@/hooks/useMessages";
import { type Profile, calculateAge, useFollowUser } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useStories } from "@/hooks/useStories";
import { useMySquadRequest, useRequestJoinSquad, useCancelSquadRequest } from "@/hooks/useSquadMembers";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsPWA } from "@/hooks/useIsPWA";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ResponsiveModal, ResponsiveModalContent, ResponsiveModalHeader, ResponsiveModalTitle } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { StoryViewer } from "@/components/feed/StoryViewer";
import { FullscreenImageViewer } from "@/components/feed/FullscreenImageViewer";

interface ProfileInfoProps {
  profile: Profile;
  followStats?: {
    followers: number;
    following: number;
    isFollowing: boolean;
  };
  isOwnProfile?: boolean;
  isDesktop?: boolean;
}
export const ProfileInfo = ({
  profile,
  followStats,
  isOwnProfile = false,
  isDesktop = false
}: ProfileInfoProps) => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const followUser = useFollowUser();
  const {
    createConversation
  } = useCreateConversation();
  const isMobile = useIsMobile();
  const isPWA = useIsPWA();
  const [isCheering, setIsCheering] = useState(followStats?.isFollowing || false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Squad request hooks (for team/school profiles)
  const isTeamOrSchool = profile.account_type === 'time';
  const { data: mySquadRequest } = useMySquadRequest(isTeamOrSchool && !isOwnProfile ? profile.id : undefined);
  const requestJoin = useRequestJoinSquad();
  const cancelRequest = useCancelSquadRequest();

  // Fullscreen image viewer state
  const [fullscreenImageOpen, setFullscreenImageOpen] = useState(false);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);
  const [fullscreenClickOrigin, setFullscreenClickOrigin] = useState<DOMRect | null>(null);

  // Story viewer state
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [clickOrigin, setClickOrigin] = useState<DOMRect | null>(null);

  // Fetch stories to check if user has active replays
  const {
    data: groupedStories
  } = useStories();
  const userStoryGroup = groupedStories?.find(g => g.userId === profile.id);
  const hasActiveStories = !!userStoryGroup && userStoryGroup.stories.length > 0;
  const hasUnviewedStories = userStoryGroup?.hasNewStory ?? false;
  const handleStoryClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasActiveStories) return;
    setClickOrigin(e.currentTarget.getBoundingClientRect());
    setStoryViewerOpen(true);
  };

  // Use Sheet on mobile or PWA, DropdownMenu on desktop
  const useSheet = isMobile || isPWA;
  const profileUrl = `${window.location.origin}/${profile.username}`;
  const handleShareProfile = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success("Link do perfil copiado!");
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = profileUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("Link do perfil copiado!");
    }
  };
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de @${profile.username}`,
          url: profileUrl
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          handleShareProfile();
        }
      }
    } else {
      handleShareProfile();
    }
  };
  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `qrcode-${profile.username}.png`;
      link.href = pngUrl;
      link.click();
      toast.success("QR Code salvo!");
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };
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
  const handleMessageClick = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setIsStartingChat(true);
    try {
      const conversationId = await createConversation(profile.id);
      if (conversationId) {
        navigate(`/messages/${conversationId}`);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Erro ao iniciar conversa");
    } finally {
      setIsStartingChat(false);
    }
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
  const handleCoverClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!profile.cover_url) return;
    setFullscreenClickOrigin(e.currentTarget.getBoundingClientRect());
    setFullscreenImageUrl(profile.cover_url);
    setFullscreenImageOpen(true);
  };

  const handleAvatarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If has active stories, open story viewer instead
    if (hasActiveStories) {
      handleStoryClick(e);
      return;
    }
    if (!profile.avatar_url) return;
    setFullscreenClickOrigin(e.currentTarget.getBoundingClientRect());
    setFullscreenImageUrl(profile.avatar_url);
    setFullscreenImageOpen(true);
  };

  // Desktop layout - MatDash inspired
  if (isDesktop) {
    return (
      <section className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border/50">
        {/* Cover Photo - wide banner */}
        <div 
          className={`w-full h-52 relative overflow-hidden ${profile.cover_url ? 'cursor-pointer' : ''}`}
          onClick={handleCoverClick}
        >
          {profile.cover_url ? (
            <img src={profile.cover_url} alt="Cover photo" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-muted/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Centered profile info */}
        <div className="flex flex-col items-center -mt-16 relative z-10 pb-6">
          {/* Avatar - centered, overlapping banner */}
          <div 
            className={`w-32 h-32 rounded-full p-[3px] transition-all duration-200 ${hasActiveStories ? hasUnviewedStories ? 'bg-gradient-to-tr from-primary to-emerald-400 cursor-pointer animate-story-ring-pulse' : 'bg-muted-foreground/40 cursor-pointer' : profile.avatar_url ? 'cursor-pointer' : ''}`} 
            onClick={handleAvatarClick}
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name || profile.username} className="w-full h-full rounded-full border-4 border-card bg-muted object-cover" />
            ) : (
              <div className="w-full h-full rounded-full border-4 border-card bg-muted flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-muted-foreground">person</span>
              </div>
            )}
          </div>

          {/* Name & role - centered */}
          <div className="mt-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-2xl font-bold text-foreground">
                {profile.full_name || profile.username}
              </h2>
              {(profile as any).is_official_account ? (
                <div className="bg-amber-500 text-white rounded-full p-1 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[14px] font-bold">star</span>
                </div>
              ) : profile.is_verified_premium && (!profile.verified_premium_expires_at || new Date(profile.verified_premium_expires_at) > new Date()) ? (
                <div className="bg-primary text-primary-foreground rounded-full p-1 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[14px] font-bold">verified</span>
                </div>
              ) : profile.conta_verificada && (
                <div className="bg-primary text-primary-foreground rounded-full p-1 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[14px] font-bold">verified</span>
                </div>
              )}
            </div>
            <p className="text-muted-foreground font-medium text-sm mt-0.5">
              {(() => {
                if (profile.account_type === 'time' || profile.account_type === 'escolinha') {
                  return profile.account_type === 'time' ? 'Time de Futebol' : 'Escolinha de Futebol';
                }
                const displayRole = profile.position_name;
                if (displayRole && profile.team) return `${displayRole} · ${profile.team}`;
                return displayRole || profile.team || `@${profile.username}`;
              })()}
            </p>
            {profile.bio && (
              <p className="text-muted-foreground/80 text-sm mt-2 max-w-md mx-auto leading-relaxed line-clamp-3 px-6">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Stats counters - prominent row */}
          <div className="flex items-center gap-0 mt-5">
            {followStats && user && (
              <>
                <button onClick={() => navigate(isOwnProfile ? "/followers?tab=followers" : `/${profile.username}/followers?tab=followers`)} className="flex flex-col items-center px-8 hover:opacity-70 transition-opacity">
                  <span className="text-2xl font-bold text-foreground">{followStats.followers}</span>
                  <span className="text-muted-foreground text-xs mt-0.5">Torcedores</span>
                </button>
                <div className="w-px h-10 bg-border" />
                <button onClick={() => navigate(isOwnProfile ? "/followers?tab=following" : `/${profile.username}/followers?tab=following`)} className="flex flex-col items-center px-8 hover:opacity-70 transition-opacity">
                  <span className="text-2xl font-bold text-foreground">{followStats.following}</span>
                  <span className="text-muted-foreground text-xs mt-0.5">Torcendo</span>
                </button>
              </>
            )}
          </div>

          {/* Physical stats chips */}
          {profile.account_type !== 'time' && profile.account_type !== 'escolinha' && (profile.role === 'atleta' || !profile.role && (profile.posicaomas || profile.posicaofem) || !profile.role && !profile.funcao) && (
            <div className="flex items-center gap-2 mt-4">
              <div className="flex items-center gap-1.5 bg-muted/60 rounded-full px-3 py-1.5 text-xs">
                <span className="material-symbols-outlined text-[14px] text-muted-foreground">cake</span>
                <span className="font-semibold text-foreground">{age || "-"} anos</span>
              </div>
              <div className="flex items-center gap-1.5 bg-muted/60 rounded-full px-3 py-1.5 text-xs">
                <span className="material-symbols-outlined text-[14px] text-muted-foreground">height</span>
                <span className="font-semibold text-foreground">{formatHeight(profile.height)}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-muted/60 rounded-full px-3 py-1.5 text-xs">
                <span className="material-symbols-outlined text-[14px] text-muted-foreground">monitor_weight</span>
                <span className="font-semibold text-foreground">{formatWeight(profile.weight ? Number(profile.weight) : null)}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-muted/60 rounded-full px-3 py-1.5 text-xs">
                <span className="material-symbols-outlined text-[14px] text-muted-foreground">footprint</span>
                <span className="font-semibold text-foreground">{formatFoot(profile.preferred_foot)}</span>
              </div>
            </div>
          )}

          {/* Action buttons - centered */}
          <div className="flex gap-3 mt-5">
            {isOwnProfile ? (
              <>
                <button onClick={() => navigate("/settings/profile")} className="bg-primary text-primary-foreground h-10 px-6 rounded-full font-semibold text-sm transition-colors hover:bg-primary/90 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Editar Perfil
                </button>
                
                {useSheet ? (
                  <>
                    <button onClick={() => setShareSheetOpen(true)} className="bg-muted hover:bg-muted/80 text-foreground h-10 px-6 rounded-full font-semibold text-sm transition-colors border border-border flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">share</span>
                      Compartilhar
                    </button>
                    <Drawer open={shareSheetOpen} onOpenChange={setShareSheetOpen}>
                      <DrawerContent>
                        <DrawerHeader className="pb-2">
                          <DrawerTitle className="text-center">Compartilhar Perfil</DrawerTitle>
                        </DrawerHeader>
                        <div className="flex flex-col gap-2 py-4 px-4">
                          <button onClick={() => { handleShareProfile(); setShareSheetOpen(false); }} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors text-left">
                            <span className="material-symbols-outlined text-[22px]">link</span>
                            <span className="font-medium">Copiar link</span>
                          </button>
                          <button onClick={() => { setShareSheetOpen(false); setQrDialogOpen(true); }} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors text-left">
                            <span className="material-symbols-outlined text-[22px]">qr_code_2</span>
                            <span className="font-medium">QR Code</span>
                          </button>
                        </div>
                      </DrawerContent>
                    </Drawer>
                  </>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="bg-muted hover:bg-muted/80 text-foreground h-10 px-6 rounded-full font-semibold text-sm transition-colors border border-border flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">share</span>
                        Compartilhar
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-48">
                      <DropdownMenuItem onClick={handleShareProfile} className="cursor-pointer">
                        <span className="material-symbols-outlined text-[18px] mr-2">link</span>
                        Copiar link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setQrDialogOpen(true)} className="cursor-pointer">
                        <span className="material-symbols-outlined text-[18px] mr-2">qr_code_2</span>
                        QR Code
                      </DropdownMenuItem>
                      {typeof navigator.share === "function" && (
                        <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
                          <span className="material-symbols-outlined text-[18px] mr-2">ios_share</span>
                          Compartilhar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            ) : (
              <>
                <button ref={buttonRef} onClick={handleFollowClick} disabled={followUser.isPending} className={`h-10 px-6 rounded-full font-semibold text-sm transition-all duration-200 ease-out flex items-center justify-center gap-2 disabled:opacity-50 ${isCheering ? "bg-muted text-primary border border-border hover:bg-muted/80 active:scale-[0.98]" : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"}`}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={isCheering ? "cheering" : "cheer"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, ease: "easeOut" }}>
                      {isCheering ? "✓ Torcendo" : "Torcer"}
                    </motion.span>
                  </AnimatePresence>
                </button>
                <button onClick={handleMessageClick} disabled={isStartingChat} className="bg-muted text-foreground h-10 px-6 rounded-full font-semibold text-sm transition-all duration-200 ease-out border border-border flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-muted/80 active:scale-[0.98]">
                  <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
                  Mensagem
                </button>
                {isTeamOrSchool && user && (
                  mySquadRequest?.status === 'pending' ? (
                    <button
                      onClick={() => cancelRequest.mutate({ requestId: mySquadRequest.id, teamProfileId: profile.id })}
                      disabled={cancelRequest.isPending}
                      className="bg-muted text-muted-foreground h-10 w-10 rounded-full font-semibold text-sm transition-all border border-border flex items-center justify-center disabled:opacity-50 hover:bg-muted/80"
                      title="Solicitado"
                    >
                      <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
                    </button>
                  ) : mySquadRequest?.status === 'approved' ? (
                    <div className="bg-primary/10 text-primary h-10 w-10 rounded-full font-semibold text-sm flex items-center justify-center" title="No elenco">
                      <span className="material-symbols-outlined text-[20px]">check</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => requestJoin.mutate(profile.id)}
                      disabled={requestJoin.isPending}
                      className="bg-primary text-primary-foreground h-10 w-10 rounded-full font-semibold text-sm transition-all flex items-center justify-center disabled:opacity-50 hover:bg-primary/90"
                      title="Fazer parte do elenco"
                    >
                      <span className="material-symbols-outlined text-[20px]">group_add</span>
                    </button>
                  )
                )}
              </>
            )}
          </div>
        </div>

      </section>
    );
  }

  // Mobile layout (original)
  return <section className="flex flex-col items-center gap-4">
      {/* Cover Photo */}
      <div 
        className={`w-full h-32 relative overflow-hidden ${profile.cover_url ? 'cursor-pointer' : ''}`}
        onClick={handleCoverClick}
      >
        {profile.cover_url ? <img src={profile.cover_url} alt="Cover photo" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center gap-1">
            <span className="material-symbols-outlined text-3xl text-muted-foreground/50">add_photo_alternate</span>
            {isOwnProfile && <span className="text-xs text-muted-foreground/50">Adicionar foto de capa</span>}
          </div>}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
      </div>

      {/* Profile Picture */}
      <div className="relative -mt-16 z-10">
        <div 
          className={`w-28 h-28 rounded-full p-[3px] transition-all duration-200 ${hasActiveStories ? hasUnviewedStories ? 'bg-gradient-to-tr from-primary to-emerald-400 cursor-pointer animate-story-ring-pulse' : 'bg-muted-foreground/40 cursor-pointer' : profile.avatar_url ? 'cursor-pointer' : ''}`} 
          onClick={handleAvatarClick}
        >
          {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name || profile.username} className="w-full h-full rounded-full border-4 border-background bg-muted object-cover" /> : <div className="w-full h-full rounded-full border-4 border-background bg-muted flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-muted-foreground">person</span>
            </div>}
        </div>
        {(profile as any).is_official_account ? (
          <div className="absolute bottom-0 right-0 bg-amber-500 text-white rounded-full p-1.5 border-4 border-background flex items-center justify-center">
            <span className="material-symbols-outlined text-[16px] font-bold">star</span>
          </div>
        ) : profile.is_verified_premium && (!profile.verified_premium_expires_at || new Date(profile.verified_premium_expires_at) > new Date()) ? (
          <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 border-4 border-background flex items-center justify-center">
            <span className="material-symbols-outlined text-[16px] font-bold">verified</span>
          </div>
        ) : profile.conta_verificada && (
          <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 border-4 border-background flex items-center justify-center">
            <span className="material-symbols-outlined text-[16px] font-bold">verified</span>
          </div>
        )}
      </div>

      {/* Name and Position */}
      <div className="text-center space-y-0.5">
        <h2 className="font-bold text-foreground leading-tight text-lg">
          {profile.full_name || profile.username}
        </h2>
        <p className="text-muted-foreground font-bold text-base">
          {(() => {
          if (profile.account_type === 'time' || profile.account_type === 'escolinha') {
            return profile.account_type === 'time' ? 'Time de Futebol' : 'Escolinha de Futebol';
          }
          const displayRole = profile.position_name;
          if (displayRole && profile.team) return `${displayRole} | ${profile.team}`;
          return displayRole || profile.team || `@${profile.username}`;
        })()}
        </p>
        {profile.bio && <p className="text-muted-foreground/80 text-sm px-4 max-w-xs mx-auto line-clamp-3 leading-relaxed">
            {profile.bio}
          </p>}
      </div>

      {followStats && user && <div className="flex items-center gap-6">
          <button onClick={() => navigate(isOwnProfile ? "/followers?tab=followers" : `/${profile.username}/followers?tab=followers`)} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
            <span className="text-foreground font-bold">{followStats.followers}</span>
            <span className="text-muted-foreground text-xs">Torcedores</span>
          </button>
          <button onClick={() => navigate(isOwnProfile ? "/followers?tab=following" : `/${profile.username}/followers?tab=following`)} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
            <span className="text-foreground font-bold">{followStats.following}</span>
            <span className="text-muted-foreground text-xs">Torcendo</span>
          </button>
        </div>}

      {profile.account_type !== 'time' && profile.account_type !== 'escolinha' && (profile.role === 'atleta' || !profile.role && (profile.posicaomas || profile.posicaofem) || !profile.role && !profile.funcao) && <div className="grid grid-cols-4 gap-2 bg-card rounded-2xl p-3 w-full py-[4px]">
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
        </div>}

      {/* Action Buttons */}
      <div className="flex w-full gap-2 mt-2 px-4 sm:max-w-xs">
        {isOwnProfile ? <>
            <button onClick={() => navigate("/settings/profile")} className="flex-1 bg-muted hover:bg-muted/80 text-foreground h-9 rounded font-semibold text-xs tracking-wide transition-colors border border-border flex items-center justify-center gap-1.5 shadow-sm">
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Editar Perfil
            </button>
            
            {useSheet ? <>
                <button onClick={() => setShareSheetOpen(true)} className="flex-1 bg-muted hover:bg-muted/80 text-foreground h-9 rounded font-semibold text-xs tracking-wide transition-colors border border-border flex items-center justify-center gap-1.5 shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">share</span>
                  Compartilhar
                </button>
                
                <Drawer open={shareSheetOpen} onOpenChange={setShareSheetOpen}>
                  <DrawerContent>
                    <DrawerHeader className="pb-2">
                      <DrawerTitle className="text-center">Compartilhar Perfil</DrawerTitle>
                    </DrawerHeader>
                    <div className="flex flex-col gap-2 py-4 px-4">
                      <button onClick={() => { handleShareProfile(); setShareSheetOpen(false); }} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors text-left">
                        <span className="material-symbols-outlined text-[22px]">link</span>
                        <span className="font-medium">Copiar link</span>
                      </button>
                      <button onClick={() => { setShareSheetOpen(false); setQrDialogOpen(true); }} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors text-left">
                        <span className="material-symbols-outlined text-[22px]">qr_code_2</span>
                        <span className="font-medium">QR Code</span>
                      </button>
                      {typeof navigator.share === "function" && <button onClick={() => { handleNativeShare(); setShareSheetOpen(false); }} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors text-left">
                          <span className="material-symbols-outlined text-[22px]">ios_share</span>
                          <span className="font-medium">Compartilhar</span>
                        </button>}
                    </div>
                  </DrawerContent>
                </Drawer>
              </> : <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex-1 bg-muted hover:bg-muted/80 text-foreground h-9 rounded font-semibold text-xs tracking-wide transition-colors border border-border flex items-center justify-center gap-1.5 shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">share</span>
                    Compartilhar
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48">
                  <DropdownMenuItem onClick={handleShareProfile} className="cursor-pointer">
                    <span className="material-symbols-outlined text-[18px] mr-2">link</span>
                    Copiar link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setQrDialogOpen(true)} className="cursor-pointer">
                    <span className="material-symbols-outlined text-[18px] mr-2">qr_code_2</span>
                    QR Code
                  </DropdownMenuItem>
                  {typeof navigator.share === "function" && <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
                      <span className="material-symbols-outlined text-[18px] mr-2">ios_share</span>
                      Compartilhar
                    </DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>}
          </> : <>
            <div className="relative flex-1">
              <button ref={buttonRef} onClick={handleFollowClick} disabled={followUser.isPending} className={`w-full h-9 rounded font-semibold text-xs tracking-wide transition-all duration-200 ease-out flex items-center justify-center disabled:opacity-50 ${isCheering ? "bg-background text-primary border border-border hover:bg-muted/50 active:scale-[0.98]" : "bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98]"}`}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={isCheering ? "cheering" : "cheer"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, ease: "easeOut" }}>
                    {isCheering ? "Torcendo" : "Torcer"}
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>
            <button onClick={handleMessageClick} disabled={isStartingChat} className="flex-1 bg-background text-foreground h-9 rounded font-semibold text-xs tracking-wide transition-all duration-200 ease-out border border-border flex items-center justify-center disabled:opacity-50 hover:bg-muted/50 active:scale-[0.98]">
              Mensagem
            </button>
            {/* Join squad button for team/school profiles */}
            {isTeamOrSchool && user && (
              mySquadRequest?.status === 'pending' ? (
                <button
                  onClick={() => cancelRequest.mutate({ requestId: mySquadRequest.id, teamProfileId: profile.id })}
                  disabled={cancelRequest.isPending}
                  className="bg-muted text-muted-foreground h-9 w-9 rounded font-semibold text-xs transition-all duration-200 ease-out border border-border flex items-center justify-center disabled:opacity-50 hover:bg-muted/80 active:scale-[0.98]"
                  title="Solicitado"
                >
                  <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                </button>
              ) : mySquadRequest?.status === 'approved' ? (
                <div className="bg-primary/10 text-primary h-9 w-9 rounded font-semibold text-xs flex items-center justify-center" title="No elenco">
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </div>
              ) : (
                <button
                  onClick={() => requestJoin.mutate(profile.id)}
                  disabled={requestJoin.isPending}
                  className="bg-primary text-primary-foreground h-9 w-9 rounded font-semibold text-xs transition-all duration-200 ease-out flex items-center justify-center disabled:opacity-50 hover:brightness-110 active:scale-[0.98]"
                  title="Fazer parte do elenco"
                >
                  <span className="material-symbols-outlined text-[18px]">group_add</span>
                </button>
              )
            )}
          </>}
      </div>

      {/* QR Code Modal */}
      <ResponsiveModal open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <ResponsiveModalContent className="sm:max-w-xs">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle className="text-center">QR Code do Perfil</ResponsiveModalTitle>
          </ResponsiveModalHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div ref={qrRef} className="bg-white p-4 rounded-xl">
              <QRCodeSVG value={profileUrl} size={200} level="H" includeMargin={false} />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              @{profile.username}
            </p>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={handleShareProfile}>
                <span className="material-symbols-outlined text-[18px] mr-2">link</span>
                Copiar
              </Button>
              <Button className="flex-1" onClick={handleDownloadQR}>
                <span className="material-symbols-outlined text-[18px] mr-2">download</span>
                Salvar
              </Button>
            </div>
          </div>
        </ResponsiveModalContent>
      </ResponsiveModal>

      {/* Story Viewer */}
      {groupedStories && hasActiveStories && <StoryViewer groupedStories={groupedStories} initialGroupIndex={groupedStories.findIndex(g => g.userId === profile.id)} isOpen={storyViewerOpen} onClose={() => setStoryViewerOpen(false)} originRect={clickOrigin} />}

      {/* Fullscreen Image Viewer for avatar/cover */}
      {fullscreenImageUrl && (
        <FullscreenImageViewer
          isOpen={fullscreenImageOpen}
          onClose={() => {
            setFullscreenImageOpen(false);
            setFullscreenImageUrl(null);
          }}
          images={[fullscreenImageUrl]}
          originRect={fullscreenClickOrigin}
        />
      )}
    </section>;
};