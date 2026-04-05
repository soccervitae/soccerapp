import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { ResponsiveAlertModal } from "@/components/ui/responsive-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsPWA } from "@/hooks/useIsPWA";
import { SupportSheet } from "@/components/support/SupportSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      setShowLogoutConfirm(false);
      await signOut();
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleClearCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      toast.success("Cache limpo com sucesso");
    } catch {
      toast.error("Erro ao limpar cache");
    }
  };

  const handleInstallApp = () => {
    navigate("/install");
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const settingsContent = (
    <>
      {/* Profile Card */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-4 w-full p-3 rounded-xl">
          <Avatar className="h-14 w-14">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {getInitials(profile?.full_name || profile?.username)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <p className="font-semibold text-foreground">{profile?.full_name || profile?.username}</p>
            {profile?.position_name && (
              <p className="text-sm text-muted-foreground">{profile.position_name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-3">Conteúdo</p>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <SettingsItem icon="star" label="Favoritos" onClick={() => navigate("/settings/favorites")} />
          <SettingsItem icon="mail" label="Mensagens de visitantes" onClick={() => navigate("/settings/guest-messages")} />
          <SettingsItem icon="bookmark" label="Salvos" onClick={() => navigate("/settings/saved")} />
          <SettingsItem icon="pending_actions" label="Meus posts e moderação" onClick={() => navigate("/settings/my-posts")} isLast />
        </div>
      </div>

      {/* Conta */}
      <div className="p-4 pt-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-3">Conta</p>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <SettingsItem icon="edit" label="Editar Perfil" onClick={() => navigate("/settings/edit")} />
          <SettingsItem icon="verified" label="Verificação de Identidade" onClick={() => navigate("/settings/identity-verification")} />
          <SettingsItem icon="star" label="Plano Pro" onClick={() => navigate("/settings/verification")} />
          <SettingsItem icon="lock" label="Privacidade" onClick={() => navigate("/settings/privacy")} />
          <SettingsItem icon="shield" label="Segurança" onClick={() => navigate("/settings/security")} />
          <SettingsItem icon="notifications" label="Notificações" onClick={() => navigate("/settings/notifications")} isLast />
        </div>
      </div>

      {/* Suporte */}
      <div className="p-4 pt-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-3">Suporte</p>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <SettingsItem icon="contact_support" label="Enviar sugestão ou reclamação" onClick={() => setShowSupport(true)} isLast />
        </div>
      </div>

      {/* Preferências */}
      <div className="p-4 pt-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-3">Preferências</p>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <SettingsItem icon="gavel" label="Diretrizes da comunidade" onClick={() => navigate("/guidelines")} />
          <SettingsItem icon="description" label="Termos de Uso" onClick={() => navigate("/terms")} />
          <SettingsItem icon="policy" label="Política de Privacidade" onClick={() => navigate("/privacy-policy")} />
          <SettingsItem icon="info" label="Sobre o SOCCER VITAE" onClick={() => {}} />
          {!isPWA && (
            <SettingsItem icon="install_mobile" label="Instalar aplicativo" onClick={handleInstallApp} />
          )}
          <SettingsItem icon="delete_sweep" label="Limpar cache" onClick={handleClearCache} isLast />
        </div>
      </div>

      {/* Sessão */}
      <div className="p-4 pt-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-3">Sessão</p>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <SettingsItem icon="logout" label="Sair da conta" onClick={() => setShowLogoutConfirm(true)} isDestructive isLast />
        </div>
      </div>

      {/* Version */}
      <div className="p-4 text-center">
        <p className="text-xs text-muted-foreground">SOCCER VITAE v1.0.0</p>
      </div>
    </>
  );

  const modals = (
    <>
      <ResponsiveAlertModal
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Sair da conta?"
        description="Você será desconectado e precisará fazer login novamente para acessar sua conta."
        cancelText="Cancelar"
        confirmText={isLoggingOut ? "Saindo..." : "Sair"}
        onConfirm={handleSignOut}
        confirmVariant="destructive"
      />
      <SupportSheet open={showSupport} onOpenChange={setShowSupport} />
    </>
  );

  if (!isMobile) {
    return (
      <div className="min-h-screen bg-muted/30">
        <DesktopHeader />
        <div className="flex pt-14 max-w-screen-2xl mx-auto">
          <DesktopSidebar />
          <main className="flex-1 min-w-0 px-4 py-4 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-xl font-semibold text-foreground mb-4">Configurações</h1>
              {settingsContent}
            </div>
          </main>
          <RightSidebar />
        </div>
        {modals}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 h-[50px] flex items-center">
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-foreground transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h1 className="text-base font-bold text-foreground ml-2">Configurações</h1>
      </header>

      <div className="pt-[50px] pb-20">
        {settingsContent}
      </div>

      {modals}
    </div>
  );
}

interface SettingsItemProps {
  icon: string;
  label: string;
  onClick: () => void;
  isDestructive?: boolean;
  isLast?: boolean;
}

function SettingsItem({ icon, label, onClick, isDestructive, isLast }: SettingsItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3.5 hover:bg-muted transition-colors ${
        !isLast ? "border-b border-border" : ""
      } ${isDestructive ? "text-destructive" : "text-foreground"}`}
    >
      <span className={`material-symbols-outlined text-[22px] ${isDestructive ? "" : "text-muted-foreground"}`}>
        {icon}
      </span>
      <span className="flex-1 text-left font-medium">{label}</span>
      {!isDestructive && (
        <span className="material-symbols-outlined text-muted-foreground text-[20px]">chevron_right</span>
      )}
    </button>
  );
}
