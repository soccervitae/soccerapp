import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUserHighlights, useAddHighlightImage, UserHighlight } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateMenuSheet } from "@/components/feed/CreateMenuSheet";
import { CreatePostSheet } from "@/components/feed/CreatePostSheet";
import { CreateReplaySheet } from "@/components/feed/CreateReplaySheet";
import { AddChampionshipSheet } from "@/components/profile/AddChampionshipSheet";
import { AddAchievementSheet } from "@/components/profile/AddAchievementSheet";
import { AddHighlightSheet } from "@/components/profile/AddHighlightSheet";
import { SelectHighlightSheet } from "@/components/profile/SelectHighlightSheet";
import { TeamSelector } from "@/components/profile/TeamSelector";
import { useUserTeams } from "@/hooks/useTeams";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type CreateOption = "post" | "replay" | "highlight" | "times" | "championship" | "achievement";

const navItems = [{
  id: "home",
  icon: "home",
  label: "Início",
  path: "/"
}, {
  id: "explore",
  icon: "search",
  label: "Buscar",
  path: "/explore"
}, {
  id: "create",
  icon: "add_box",
  label: "Criar",
  path: null
}, {
  id: "messages",
  icon: "chat",
  label: "Mensagens",
  path: "/messages"
}, {
  id: "notifications",
  icon: "notifications",
  label: "Notificações",
  path: null
}, {
  id: "profile",
  icon: "person",
  label: "Perfil",
  path: "/profile"
}, {
  id: "settings",
  icon: "settings",
  label: "Configurações",
  path: "/settings/edit"
}];

export const DesktopSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: userTeams = [] } = useUserTeams(user?.id);
  const { data: highlights = [] } = useUserHighlights(user?.id);
  const addHighlightImage = useAddHighlightImage();
  const addMediaInputRef = useRef<HTMLInputElement>(null);
  const [selectedHighlightForMedia, setSelectedHighlightForMedia] = useState<UserHighlight | null>(null);
  const [isAddingMedia, setIsAddingMedia] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [isReplayOpen, setIsReplayOpen] = useState(false);
  const [isSelectHighlightOpen, setIsSelectHighlightOpen] = useState(false);
  const [isAddHighlightOpen, setIsAddHighlightOpen] = useState(false);
  const [isTimesOpen, setIsTimesOpen] = useState(false);
  const [isChampionshipOpen, setIsChampionshipOpen] = useState(false);
  const [isAchievementOpen, setIsAchievementOpen] = useState(false);
  const currentPath = location.pathname;
  
  const isActive = (path: string | null) => {
    if (!path) return false;
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };
  
  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.id === "create") {
      setIsMenuOpen(true);
    } else if (item.path) {
      navigate(item.path);
    }
  };
  
  const handleSelectOption = (option: CreateOption) => {
    switch (option) {
      case "post":
        setIsPostOpen(true);
        break;
      case "replay":
        setIsReplayOpen(true);
        break;
      case "highlight":
        setIsSelectHighlightOpen(true);
        break;
      case "times":
        setIsTimesOpen(true);
        break;
      case "championship":
        setIsChampionshipOpen(true);
        break;
      case "achievement":
        setIsAchievementOpen(true);
        break;
    }
  };

  const handleSelectExistingHighlight = (highlight: UserHighlight) => {
    setSelectedHighlightForMedia(highlight);
    setTimeout(() => {
      addMediaInputRef.current?.click();
    }, 100);
  };

  const handleAddMediaToExistingHighlight = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedHighlightForMedia || !user) return;

    setIsAddingMedia(true);
    const isVideo = file.type.startsWith('video/');
    const mediaType = isVideo ? 'video' : 'image';

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("post-media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("post-media")
        .getPublicUrl(fileName);

      await addHighlightImage.mutateAsync({
        highlightId: selectedHighlightForMedia.id,
        imageUrl: publicUrl,
        mediaType,
      });

      toast.success(isVideo ? "Vídeo adicionado ao destaque!" : "Foto adicionada ao destaque!");
    } catch (error) {
      console.error("Error adding media:", error);
      toast.error("Erro ao adicionar mídia");
    } finally {
      setIsAddingMedia(false);
      setSelectedHighlightForMedia(null);
      e.target.value = "";
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return <>
      <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-64 flex-shrink-0 overflow-y-auto border-r border-border bg-card p-4">
        {/* User Profile Card */}
        

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map(item => {
          const active = isActive(item.path);
          return <button key={item.id} onClick={() => handleNavClick(item)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${active ? "bg-primary text-primary-foreground font-semibold" : "text-foreground hover:bg-muted"}`}>
                <span className={`material-symbols-outlined text-[24px] ${active ? "fill-1" : ""}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>;
        })}
        </nav>
      </aside>

      {/* Hidden input for adding media to existing highlight */}
      <input
        ref={addMediaInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleAddMediaToExistingHighlight}
      />

      {/* Create Sheets */}
      <CreateMenuSheet open={isMenuOpen} onOpenChange={setIsMenuOpen} onSelectOption={handleSelectOption} />
      <CreatePostSheet open={isPostOpen} onOpenChange={setIsPostOpen} />
      <CreateReplaySheet open={isReplayOpen} onOpenChange={setIsReplayOpen} />
      <SelectHighlightSheet
        open={isSelectHighlightOpen}
        onOpenChange={setIsSelectHighlightOpen}
        highlights={highlights}
        onSelectHighlight={handleSelectExistingHighlight}
        onCreateNew={() => setIsAddHighlightOpen(true)}
      />
      <AddHighlightSheet open={isAddHighlightOpen} onOpenChange={setIsAddHighlightOpen} />
      <TeamSelector open={isTimesOpen} onOpenChange={setIsTimesOpen} selectedTeamIds={userTeams.map(t => t.id)} />
      <AddChampionshipSheet open={isChampionshipOpen} onOpenChange={setIsChampionshipOpen} />
      <AddAchievementSheet open={isAchievementOpen} onOpenChange={setIsAchievementOpen} />
    </>;
};