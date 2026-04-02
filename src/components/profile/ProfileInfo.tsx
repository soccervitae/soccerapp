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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ResponsiveModal, ResponsiveModalContent, ResponsiveModalHeader, ResponsiveModalTitle } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { StoryViewer } from "@/components/feed/StoryViewer";
import { FullscreenImageViewer } from "@/components/feed/FullscreenImageViewer";
import { GuestContactModal } from "@/components/profile/GuestContactModal";

function FavoriteButton({ profileId, onDone }: { profileId: string; onDone: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: isFavorited } = useQuery({
    queryKey: ["is_favorited", user?.id, profileId],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from("favorite_profiles")
        .select("id")
        .eq("user_id", user.id)
        .eq("favorite_id", profileId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id,
  });

  const handleToggle = async () => {
    if (!user?.id) return;
    if (isFavorited) {
      await supabase
        .from("favorite_profiles")
        .delete()
        .eq("user_id", user.id)
        .eq("favorite_id", profileId);
      toast.success("Removido dos favoritos");
    } else {
      await supabase
        .from("favorite_profiles")
        .insert({ user_id: user.id, favorite_id: profileId });
      toast.success("Perfil favoritado!");
    }
    queryClient.invalidateQueries({ queryKey: ["is_favorited", user.id, profileId] });
    queryClient.invalidateQueries({ queryKey: ["favorite_profiles"] });
    onDone();
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors text-left"
    >
      <span className="material-symbols-outlined text-[22px]">{isFavorited ? "star" : "star"}</span>
      <span className="font-medium">{isFavorited ? "Remover dos favoritos" : "Favoritar"}</span>
    </button>
  );
}

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
  const [cheeringSheetOpen, setCheeringSheetOpen] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [guestContactOpen, setGuestContactOpen] = useState(false);
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
      setAuthPromptOpen(true);
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
      if (!isMobile) {
        setGuestContactOpen(true);
      } else {
        navigate(`/${profile.username}/contact`);
      }
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

  // Desktop layout - reference-inspired (avatar bottom-left, info right)
  if (isDesktop) {
    return (
      <section className="bg-card shadow-sm overflow-hidden border border-border/50">
        {/* Cover Photo - wide banner */}
        <div 
          className={`w-full h-56 relative overflow-hidden ${profile.cover_url ? 'cursor-pointer' : ''}`}
          onClick={handleCoverClick}
        >
          {profile.cover_url ? (
            <img src={profile.cover_url} alt="Cover photo" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-muted/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card/60 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Profile info row: avatar left, info center, stats right */}
        <div className="relative px-6 pb-6">
          <div className="flex items-end gap-5 -mt-14">
            {/* Avatar - bottom-left overlapping cover */}
            <div 
              className={`w-28 h-28 rounded-full p-[3px] flex-shrink-0 transition-all duration-200 ${hasActiveStories ? hasUnviewedStories ? 'bg-gradient-to-tr from-primary to-emerald-400 cursor-pointer animate-story-ring-pulse' : 'bg-muted-foreground/40 cursor-pointer' : profile.avatar_url ? 'cursor-pointer' : ''}`} 
              onClick={handleAvatarClick}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name || profile.username} className="w-full h-full rounded-full border-4 border-card bg-muted object-cover" />
              ) : (
                <div className="w-full h-full rounded-full border-4 border-card bg-muted flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-muted-foreground">person</span>
                </div>
              )}
            </div>

            {/* Name, position, bio */}
            <div className="flex-1 min-w-0 pt-16">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-foreground truncate">
                  {profile.nickname || profile.full_name || profile.username}
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
              {profile.position_name && profile.account_type !== 'time' && (
                <p className="text-muted-foreground text-sm mt-0.5">{profile.position_name}</p>
              )}
              {profile.account_type === 'time' && (
                <p className="text-muted-foreground font-medium text-sm mt-0.5">Time de Futebol</p>
              )}
              {profile.team && profile.account_type !== 'time' && (
                <p className="text-muted-foreground font-medium text-sm mt-0.5">{profile.team}</p>
              )}
            </div>

            {/* Stats + action buttons on the right */}
            <div className="flex items-center gap-4 flex-shrink-0 pt-16">

              {/* Action buttons inline */}
              <div className="flex items-center gap-2">
                {isOwnProfile ? (
                  <>
                    <button onClick={() => navigate("/settings/profile")} className="bg-primary text-primary-foreground h-10 px-5 rounded-sm font-semibold text-sm transition-colors hover:bg-primary/90 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                      Editar
                    </button>
                    {useSheet ? (
                      <>
                        <button onClick={() => setShareSheetOpen(true)} className="bg-muted hover:bg-muted/80 text-foreground h-10 w-10 rounded-full text-sm transition-colors border border-border flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px]">share</span>
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
                          <button className="bg-muted hover:bg-muted/80 text-foreground h-10 w-10 rounded-full text-sm transition-colors border border-border flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">share</span>
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
                ) : !user ? (
                  <>
                    <button onClick={handleMessageClick} className="bg-muted hover:bg-muted/80 text-foreground h-10 px-5 rounded-lg font-semibold text-sm transition-colors border border-border flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
                      Mensagem
                    </button>
                  </>
                ) : (
                  <>
                    <button ref={buttonRef} onClick={isCheering ? () => setCheeringSheetOpen(true) : handleFollowClick} disabled={followUser.isPending} className={`h-10 px-5 rounded-lg font-semibold text-sm transition-all duration-200 ease-out flex items-center justify-center gap-1.5 disabled:opacity-50 ${isCheering ? "bg-muted text-primary border border-border hover:bg-muted/80 active:scale-[0.98]" : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"}`}>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span key={isCheering ? "cheering" : "cheer"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, ease: "easeOut" }} className="flex items-center gap-1">
                          {isCheering ? <>Torcendo <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span></> : "Torcer"}
                        </motion.span>
                      </AnimatePresence>
                    </button>
                    <button onClick={handleMessageClick} disabled={isStartingChat} className="bg-muted text-foreground h-10 w-10 rounded-lg text-sm transition-all duration-200 ease-out border border-border flex items-center justify-center disabled:opacity-50 hover:bg-muted/80 active:scale-[0.98]">
                      <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-muted-foreground/80 text-sm mt-3 max-w-xl leading-relaxed line-clamp-3 ml-[8.5rem]">
              {profile.bio}
            </p>
          )}

          {/* Physical stats - grid like mobile */}
          {profile.account_type !== 'time' && (profile.role === 'atleta' || !profile.role && (profile.posicaomas || profile.posicaofem) || !profile.role && !profile.funcao) && (
            <div className="grid grid-cols-4 gap-2 bg-muted/30 p-3 w-full mt-4 rounded-xl border border-border/50">
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
          )}

          {/* Team Stats - grid like mobile */}
          {profile.account_type === 'time' && (
            <div className="grid grid-cols-3 gap-2 bg-muted/30 p-3 w-full mt-4 rounded-xl border border-border/50">
              <div className="flex flex-col gap-1 p-2 text-center">
                <p className="text-foreground text-sm font-bold">{profile.foundation_year || "-"}</p>
                <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Fundação</p>
              </div>
              <div className="flex flex-col gap-1 p-2 border-l border-border text-center">
                <p className="text-foreground text-sm font-bold">{profile.city || "-"}</p>
                <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Cidade</p>
              </div>
              <div className="flex flex-col gap-1 p-2 border-l border-border text-center">
                <p className="text-foreground text-sm font-bold capitalize">{profile.team_category || "-"}</p>
                <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Categoria</p>
              </div>
            </div>
          )}

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
      </div>

      {/* Name and Position */}
      <div className="text-center space-y-0.5">
        <h2 className="font-bold text-foreground leading-tight text-xl">
          {profile.nickname || profile.full_name || profile.username}
        </h2>
        {profile.position_name && profile.account_type !== 'time' && (
          <p className="text-base text-secondary-foreground font-light">
            {profile.position_name}
          </p>
        )}
        {profile.account_type === 'time' && (
          <p className="text-muted-foreground font-medium text-sm mt-0.5">Time de Futebol</p>
        )}
        {profile.team && profile.account_type !== 'time' && (
          <p className="text-muted-foreground font-medium text-sm mt-0.5">{profile.team}</p>
        )}
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

      {profile.account_type !== 'time' && (profile.role === 'atleta' || !profile.role && (profile.posicaomas || profile.posicaofem) || !profile.role && !profile.funcao) && <div className="grid grid-cols-4 gap-2 bg-card p-3 w-full py-[4px] rounded-none">
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

      {/* Team Stats - Foundation Year, City, Category */}
      {profile.account_type === 'time' && <div className="grid grid-cols-3 gap-2 bg-card p-3 w-full py-[4px] rounded-none">
          <div className="flex flex-col gap-1 p-2 text-center">
            <p className="text-foreground text-sm font-bold">{profile.foundation_year || "-"}</p>
            <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Fundação</p>
          </div>
          <div className="flex flex-col gap-1 p-2 border-l border-border text-center">
            <p className="text-foreground text-sm font-bold">{profile.city || "-"}</p>
            <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Cidade</p>
          </div>
          <div className="flex flex-col gap-1 p-2 border-l border-border text-center">
            <p className="text-foreground text-sm font-bold">{profile.team_category || "-"}</p>
            <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Categoria</p>
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
          </> : !user ? <>
            <button onClick={() => setShareSheetOpen(true)} className="flex-1 bg-muted text-foreground h-9 rounded font-semibold text-xs tracking-wide transition-colors hover:bg-muted/80 border border-border flex items-center justify-center gap-1.5 shadow-sm">
              <span className="material-symbols-outlined text-[16px]">share</span>
              Compartilhar
            </button>
            <button onClick={handleMessageClick} className="flex-1 bg-muted text-foreground h-9 rounded font-semibold text-xs tracking-wide transition-colors hover:bg-muted/80 border border-border flex items-center justify-center gap-1.5 shadow-sm">
              <span className="material-symbols-outlined text-[16px]">chat_bubble_outline</span>
              Mensagem
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
          </> : <>
            <div className="relative flex-1">
              <button ref={buttonRef} onClick={isCheering ? () => setCheeringSheetOpen(true) : handleFollowClick} disabled={followUser.isPending} className={`w-full h-9 rounded font-semibold text-xs tracking-wide transition-all duration-200 ease-out flex items-center justify-center disabled:opacity-50 ${isCheering ? "bg-background text-primary border border-border hover:bg-muted/50 active:scale-[0.98]" : "bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98]"}`}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={isCheering ? "cheering" : "cheer"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, ease: "easeOut" }} className="flex items-center gap-1">
                    {isCheering ? <>Torcendo <span className="material-symbols-outlined text-[14px]">keyboard_arrow_down</span></> : "Torcer"}
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>
            <button onClick={handleMessageClick} disabled={isStartingChat} className="flex-1 bg-background text-foreground h-9 rounded font-semibold text-xs tracking-wide transition-all duration-200 ease-out border border-border flex items-center justify-center disabled:opacity-50 hover:bg-muted/50 active:scale-[0.98]">
              Mensagem
            </button>
              
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

      {/* Cheering Options Sheet */}
      <Drawer open={cheeringSheetOpen} onOpenChange={setCheeringSheetOpen}>
        <DrawerContent>
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-center">@{profile.username}</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-2 py-4 px-4">
            <FavoriteButton profileId={profile.id} onDone={() => setCheeringSheetOpen(false)} />
            <button
              onClick={() => {
                handleFollowClick();
                setCheeringSheetOpen(false);
              }}
              className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors text-left text-destructive"
            >
              <span className="material-symbols-outlined text-[22px]">person_remove</span>
              <span className="font-medium">Deixar de torcer</span>
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Auth Prompt Modal */}
      <ResponsiveModal open={authPromptOpen} onOpenChange={setAuthPromptOpen}>
        <ResponsiveModalContent className="sm:max-w-sm">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle className="text-center">Entre no SOCCER VITAE</ResponsiveModalTitle>
          </ResponsiveModalHeader>
          <div className="flex flex-col items-center gap-4 py-4 px-2">
            <p className="text-sm text-muted-foreground text-center">
              Você precisa estar logado ou criar sua conta para usar esta funcionalidade.
            </p>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={() => { setAuthPromptOpen(false); navigate("/login"); }}>
                Entrar
              </Button>
              <Button className="flex-1" onClick={() => { setAuthPromptOpen(false); navigate("/auth"); }}>
                Criar conta
              </Button>
            </div>
          </div>
        </ResponsiveModalContent>
      </ResponsiveModal>
      {/* Guest Contact Modal (Desktop) */}
      <GuestContactModal
        open={guestContactOpen}
        onOpenChange={setGuestContactOpen}
        profile={profile}
      />
    </section>;
};