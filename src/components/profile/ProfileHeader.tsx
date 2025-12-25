import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProfileSettingsSheet } from "./ProfileSettingsSheet";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProfileHeaderProps {
  username: string;
  isOwnProfile?: boolean;
}

export const ProfileHeader = ({ username, isOwnProfile = false }: ProfileHeaderProps) => {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/@${username}`;
    
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success("Link do perfil copiado!");
    } catch {
      // Fallback for older browsers
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
    const profileUrl = `${window.location.origin}/@${username}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de @${username}`,
          url: profileUrl,
        });
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== "AbortError") {
          handleShareProfile();
        }
      }
    } else {
      handleShareProfile();
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-foreground transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h1 className="text-base font-bold text-foreground tracking-wide">{username}</h1>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-foreground transition-colors">
                <span className="material-symbols-outlined text-[24px]">share</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleShareProfile} className="cursor-pointer">
                <span className="material-symbols-outlined text-[18px] mr-2">link</span>
                Copiar link
              </DropdownMenuItem>
              {typeof navigator.share === "function" && (
                <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
                  <span className="material-symbols-outlined text-[18px] mr-2">ios_share</span>
                  Compartilhar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {isOwnProfile ? (
            <button 
              onClick={() => setSettingsOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-foreground transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">more_horiz</span>
            </button>
          ) : null}
        </div>
      </header>

      {isOwnProfile && (
        <ProfileSettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
      )}
    </>
  );
};
