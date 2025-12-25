import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ProfileSettingsSheet } from "./ProfileSettingsSheet";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";

interface ProfileHeaderProps {
  username: string;
  isOwnProfile?: boolean;
}

export const ProfileHeader = ({ username, isOwnProfile = false }: ProfileHeaderProps) => {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const profileUrl = `${window.location.origin}/@${username}`;

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
          title: `Perfil de @${username}`,
          url: profileUrl,
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
      link.download = `qrcode-${username}.png`;
      link.href = pngUrl;
      link.click();
      toast.success("QR Code salvo!");
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
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

      {/* QR Code Modal - Responsive */}
      <ResponsiveModal open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <ResponsiveModalContent className="sm:max-w-xs">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle className="text-center">QR Code do Perfil</ResponsiveModalTitle>
          </ResponsiveModalHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div 
              ref={qrRef}
              className="bg-white p-4 rounded-xl"
            >
              <QRCodeSVG 
                value={profileUrl}
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              @{username}
            </p>
            <div className="flex gap-2 w-full">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleShareProfile}
              >
                <span className="material-symbols-outlined text-[18px] mr-2">link</span>
                Copiar
              </Button>
              <Button 
                className="flex-1"
                onClick={handleDownloadQR}
              >
                <span className="material-symbols-outlined text-[18px] mr-2">download</span>
                Salvar
              </Button>
            </div>
          </div>
        </ResponsiveModalContent>
      </ResponsiveModal>
    </>
  );
};
