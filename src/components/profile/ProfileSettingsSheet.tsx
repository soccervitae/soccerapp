import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { usePwaInstall } from "@/hooks/usePwaInstall";

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-8">
        <SheetHeader className="px-4 pb-2">
          <SheetTitle className="text-center">Configurações</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-2">
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
              onClick={() => handleComingSoon("Notificações")}
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
            {isInstallable && !isInstalled && (
              <SettingsItem
                icon="download"
                label="Instalar App"
                onClick={handleInstallApp}
                variant="primary"
              />
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
      </SheetContent>
    </Sheet>
  );
};
