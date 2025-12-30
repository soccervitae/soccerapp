import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { Separator } from "@/components/ui/separator";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProfileSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SettingsItemProps {
  icon: string;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger" | "primary";
}

const SettingsItem = ({ icon, label, onClick, variant = "default" }: SettingsItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
      variant === "danger"
        ? "text-destructive hover:bg-destructive/10"
        : variant === "primary"
        ? "text-primary hover:bg-primary/10"
        : "text-foreground hover:bg-muted"
    }`}
  >
    <span className="material-symbols-outlined text-[22px]">{icon}</span>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

const SectionHeader = ({ title }: { title: string }) => (
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2">
    {title}
  </p>
);

export const ProfileSettingsSheet = ({ open, onOpenChange }: ProfileSettingsSheetProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isInstallable, isInstalled, promptInstall } = usePwaInstall();

  const handleNavigation = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const handleComingSoon = (feature: string) => {
    toast.info(`${feature} estará disponível em breve`);
  };

  const handleInstallApp = async () => {
    const installed = await promptInstall();
    if (installed) {
      toast.success("App instalado com sucesso!");
      onOpenChange(false);
    }
  };

  const handleLogout = async () => {
    onOpenChange(false);
    await signOut();
    navigate("/login");
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="sm:max-w-md">
        <ResponsiveModalHeader className="px-4 pb-2">
          <ResponsiveModalTitle className="text-center">Configurações</ResponsiveModalTitle>
        </ResponsiveModalHeader>

        <ScrollArea className="h-[calc(80vh-80px)] max-h-[500px]">
          <div className="mt-4 space-y-2 pb-6 px-1">
            {/* Conta */}
            <div>
              <SectionHeader title="Conta" />
              <SettingsItem
                icon="person"
                label="Editar perfil"
                onClick={() => handleNavigation("/settings/profile")}
              />
              <SettingsItem
                icon="lock"
                label="Privacidade"
                onClick={() => handleNavigation("/settings/privacy")}
              />
              <SettingsItem
                icon="shield"
                label="Segurança"
                onClick={() => handleNavigation("/settings/security")}
              />
              <SettingsItem
                icon="notifications"
                label="Notificações"
                onClick={() => handleNavigation("/settings/notifications")}
              />
            </div>

            <Separator className="my-2" />

            {/* Preferências */}
            <div>
              <SectionHeader title="Preferências" />
              <SettingsItem
                icon="language"
                label="Idioma"
                onClick={() => handleComingSoon("Idioma")}
              />
              <SettingsItem
                icon="dark_mode"
                label="Tema"
                onClick={() => handleComingSoon("Tema")}
              />
              <SettingsItem
                icon="info"
                label="Sobre"
                onClick={() => handleComingSoon("Sobre")}
              />
              {!isInstalled && (
                <>
                  {isInstallable ? (
                    <SettingsItem
                      icon="download"
                      label="Instalar App"
                      onClick={handleInstallApp}
                      variant="primary"
                    />
                  ) : (
                    <SettingsItem
                      icon="phone_android"
                      label="Como instalar o app"
                      onClick={() => handleNavigation("/install")}
                    />
                  )}
                </>
              )}
            </div>

            <Separator className="my-2" />

            {/* Sessão */}
            <div>
              <SectionHeader title="Sessão" />
              <SettingsItem
                icon="logout"
                label="Sair da conta"
                onClick={handleLogout}
                variant="danger"
              />
            </div>
          </div>
        </ScrollArea>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
