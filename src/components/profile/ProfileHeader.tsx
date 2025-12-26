import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProfileSettingsSheet } from "./ProfileSettingsSheet";

interface ProfileHeaderProps {
  username: string;
  isOwnProfile?: boolean;
}

export const ProfileHeader = ({ username, isOwnProfile = false }: ProfileHeaderProps) => {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

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
          {isOwnProfile ? (
            <button 
              onClick={() => setSettingsOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-foreground transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">more_horiz</span>
            </button>
          ) : (
            <div className="w-10 h-10" />
          )}
        </div>
      </header>

      {isOwnProfile && (
        <ProfileSettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
      )}
    </>
  );
};
