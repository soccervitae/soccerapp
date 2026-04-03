import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useFollowUser } from "@/hooks/useProfile";
import { usePresenceContext } from "@/contexts/PresenceContext";
import { useConversationsContext } from "@/contexts/ConversationsContext";
import { useChatPopup } from "@/contexts/ChatPopupContext";

import { Skeleton } from "@/components/ui/skeleton";
import { AdBanner } from "@/components/feed/AdBanner";

const trendingTopics = [
  { tag: "#CopaLibertadores2025", posts: "12.4k" },
  { tag: "#Brasileirão", posts: "8.2k" },
  { tag: "#TreinoDeHoje", posts: "5.1k" },
  { tag: "#FutebolFeminino", posts: "3.8k" },
  { tag: "#BaseDaBase", posts: "2.5k" },
];

export const RightSidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const followUser = useFollowUser();
  const { isUserOnline } = usePresenceContext();
  const { totalUnread, conversations } = useConversationsContext();
  const { openChat } = useChatPopup();
  const { createConversation } = useCreateConversation();

  // Fetch following users for online section
  const { data: followingUsers } = useQuery({
    queryKey: ["following-users-sidebar", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: following } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      
      if (!following || following.length === 0) return [];
      
      const followingIds = following.map(f => f.following_id);
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", followingIds);
      
      return data || [];
    },
    enabled: !!user,
  });

  const onlineFollowing = useMemo(() => {
    return followingUsers?.filter(u => isUserOnline(u.id)) || [];
  }, [followingUsers, isUserOnline]);

  const handleStartChat = async (userProfile: { id: string; username: string; full_name: string | null; avatar_url: string | null }) => {
    const conversationId = await createConversation(userProfile.id);
    if (conversationId) {
      openChat(conversationId, {
        id: userProfile.id,
        username: userProfile.username,
        full_name: userProfile.full_name,
        avatar_url: userProfile.avatar_url,
      });
    }
  };

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["profile-suggestions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get profiles the user doesn't follow yet
      const { data: following } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = following?.map((f) => f.following_id) || [];
      followingIds.push(user.id); // Exclude self

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, team, gender, role, posicaomas, posicaofem, funcao")
        .not("id", "in", `(${followingIds.join(",")})`)
        .limit(5);

      if (error) throw error;
      
      // Fetch position names
      const positionNamesMap = new Map<string, string>();
      const malePositionIds = new Set<number>();
      const femalePositionIds = new Set<number>();
      
      data?.forEach(profile => {
        const isMale = profile.gender === 'homem' || profile.gender === 'masculino' || profile.gender === 'male';
        const isFemale = profile.gender === 'mulher' || profile.gender === 'feminino' || profile.gender === 'female';
        if (isMale && profile.posicaomas) {
          malePositionIds.add(profile.posicaomas);
        } else if (isFemale && profile.posicaofem) {
          femalePositionIds.add(profile.posicaofem);
        }
      });
      
      const [malePositions, femalePositions] = await Promise.all([
        malePositionIds.size > 0 
          ? supabase.from('posicao_masculina').select('id, name').in('id', Array.from(malePositionIds))
          : { data: [] },
        femalePositionIds.size > 0
          ? supabase.from('posicao_feminina').select('id, name').in('id', Array.from(femalePositionIds))
          : { data: [] },
      ]);
      
      malePositions.data?.forEach(p => positionNamesMap.set(`m-${p.id}`, p.name));
      femalePositions.data?.forEach(p => positionNamesMap.set(`f-${p.id}`, p.name));
      
      return data?.map(profile => {
        const isMale = profile.gender === 'homem' || profile.gender === 'masculino' || profile.gender === 'male';
        const isFemale = profile.gender === 'mulher' || profile.gender === 'feminino' || profile.gender === 'female';
        let positionName: string | null = null;
        if (isMale && profile.posicaomas) {
          positionName = positionNamesMap.get(`m-${profile.posicaomas}`) || null;
        } else if (isFemale && profile.posicaofem) {
          positionName = positionNamesMap.get(`f-${profile.posicaofem}`) || null;
        }
        return { ...profile, position_name: positionName };
      }) || [];
    },
    enabled: !!user,
  });

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFollow = (userId: string) => {
    followUser.mutate({ userId, isFollowing: false });
  };

  return (
    <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-80 flex-shrink-0 flex flex-col p-4 hidden xl:block">
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Suggestions */}
        <div className="rounded-xl bg-card border border-border p-4">
          <h3 className="font-semibold text-foreground mb-4">Sugestões para você</h3>
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))
            ) : suggestions && suggestions.length > 0 ? (
              suggestions.map((profile) => (
                <div key={profile.id} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {getInitials(profile.full_name || profile.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {profile.full_name || profile.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {profile.position_name || "Atleta"} {profile.team && `• ${profile.team}`}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleFollow(profile.id)}
                    disabled={followUser.isPending}
                  >
                    Torcer
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma sugestão disponível
              </p>
            )}
          </div>
        </div>

        {/* Ad Banner */}
        <div>
          <AdBanner slot="" format="auto" responsive={true} />
        </div>

        {/* Footer Links */}
        <div className="px-2">
          <p className="text-xs text-muted-foreground">
            Sobre • Ajuda • Privacidade • Termos
          </p>
          <p className="text-xs text-muted-foreground mt-1">© 2025 SOCCER VITAE</p>
        </div>
      </div>

      {/* Messages - Fixed at bottom */}
      <MessagesSection
        conversations={conversations}
        onlineFollowing={onlineFollowing}
        followingUsers={followingUsers}
        totalUnread={totalUnread}
        navigate={navigate}
        getInitials={getInitials}
        isUserOnline={isUserOnline}
      />
    </aside>
  );
};

interface MessagesSectionProps {
  conversations: any[];
  onlineFollowing: any[];
  followingUsers: any[] | undefined;
  totalUnread: number;
  navigate: (path: string) => void;
  getInitials: (name: string | null | undefined) => string;
  isUserOnline: (userId: string) => boolean;
}

function MessagesSection({ conversations, onlineFollowing, followingUsers, totalUnread, navigate, getInitials, isUserOnline }: MessagesSectionProps) {
  const { openContactPicker } = useChatPopup();

  const avatarUsers = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; username: string; full_name: string | null; avatar_url: string | null; isOnline: boolean }[] = [];

    conversations.forEach((conv: any) => {
      if (conv.participant && !seen.has(conv.participant.id)) {
        seen.add(conv.participant.id);
        result.push({
          id: conv.participant.id,
          username: conv.participant.username,
          full_name: conv.participant.nickname || conv.participant.full_name,
          avatar_url: conv.participant.avatar_url,
          isOnline: isUserOnline(conv.participant.id),
        });
      }
    });

    onlineFollowing.forEach((u: any) => {
      if (!seen.has(u.id)) {
        seen.add(u.id);
        result.push({ id: u.id, username: u.username, full_name: u.full_name, avatar_url: u.avatar_url, isOnline: true });
      }
    });

    followingUsers?.forEach((u: any) => {
      if (!seen.has(u.id)) {
        seen.add(u.id);
        result.push({ id: u.id, username: u.username, full_name: u.full_name, avatar_url: u.avatar_url, isOnline: isUserOnline(u.id) });
      }
    });

    return result;
  }, [conversations, onlineFollowing, followingUsers, isUserOnline]);

  return (
    <div className="rounded-xl bg-card border border-border p-3 mt-4 flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">chat</span>
          <h3 className="font-semibold text-foreground text-sm">Mensagens</h3>
          {totalUnread > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </div>
        <button
          onClick={() => navigate("/messages")}
          className="text-xs text-primary hover:underline"
        >
          Ver todas
        </button>
      </div>

      {avatarUsers.length > 0 ? (
        <button
          onClick={openContactPicker}
          className="flex items-center w-full group"
        >
          <div className="flex items-center -space-x-2">
            {avatarUsers.slice(0, 8).map((u, i) => (
              <div key={u.id} className="relative" style={{ zIndex: 8 - i }}>
                <Avatar className="h-9 w-9 ring-2 ring-card">
                  <AvatarImage src={u.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {getInitials(u.full_name || u.username)}
                  </AvatarFallback>
                </Avatar>
                {u.isOnline && (
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-card" />
                )}
              </div>
            ))}
            {avatarUsers.length > 8 && (
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center ring-2 ring-card text-xs font-medium text-muted-foreground" style={{ zIndex: 0 }}>
                +{avatarUsers.length - 8}
              </div>
            )}
          </div>
        </button>
      ) : (
        <div className="text-center py-3">
          <span className="material-symbols-outlined text-[28px] text-muted-foreground/50 mb-1">group_off</span>
          <p className="text-xs text-muted-foreground">Nenhuma conversa ainda</p>
        </div>
      )}
    </div>
  );
}
