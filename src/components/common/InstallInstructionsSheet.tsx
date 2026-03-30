import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Share, Plus, MoreVertical, Download } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";

type DeviceType = "ios" | "android" | "unknown";

const useDeviceType = (): DeviceType => {
  return useMemo(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return "ios";
    if (/android/.test(ua)) return "android";
    return "unknown";
  }, []);
};

interface InstallInstructionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InstallInstructionsSheet = ({ open, onOpenChange }: InstallInstructionsSheetProps) => {
  const deviceType = useDeviceType();
  const { isInstallable, promptInstall } = usePwaInstall();

  const iosSteps = [
    { title: "Abra no Safari", desc: "Use o navegador Safari", icon: null },
    { title: "Toque em Compartilhar", desc: "Ícone na barra inferior", icon: Share },
    { title: "Adicionar à Tela de Início", desc: "Role e selecione a opção", icon: Plus },
    { title: "Confirme", desc: "Toque em 'Adicionar'", icon: null },
  ];

  const androidSteps = [
    { title: "Abra no Chrome", desc: "Use o Google Chrome", icon: null },
    { title: "Toque no menu", desc: "Três pontos (⋮)", icon: MoreVertical },
    { title: "Instalar app", desc: "Ou 'Adicionar à tela'", icon: null },
    { title: "Confirme", desc: "Toque em 'Instalar'", icon: null },
  ];

  const steps = deviceType === "ios" ? iosSteps : androidSteps;
  const osLabel = deviceType === "ios" ? "iPhone / iPad" : deviceType === "android" ? "Android" : "seu dispositivo";

  const handleNativeInstall = async () => {
    await promptInstall();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="text-lg font-bold">
            Instalar no {osLabel}
          </SheetTitle>
        </SheetHeader>

        {/* Native install button if available */}
        {isInstallable && deviceType === "android" && (
          <Button
            onClick={handleNativeInstall}
            className="w-full gap-2 mb-6"
            size="lg"
          >
            <Download className="h-5 w-5" />
            Instalar Agora
          </Button>
        )}

        {/* Step-by-step instructions */}
        <div className="space-y-4 pb-6">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {index + 1}
              </div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-foreground">{step.title}</p>
                  {step.icon && <step.icon className="h-4 w-4 text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default InstallInstructionsSheet;
