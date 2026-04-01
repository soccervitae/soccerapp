import { ReactNode, useState } from "react";
import { useIsPWA } from "@/hooks/useIsPWA";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import InstallInstructionsSheet from "@/components/common/InstallInstructionsSheet";
import logoVerde from "@/assets/SOCCERVITAE_LOGO_NOVO_verde.png";

interface PwaOnlyGateProps {
  children: ReactNode;
}

const PwaOnlyGate = ({ children }: PwaOnlyGateProps) => {
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  const [showInstall, setShowInstall] = useState(false);

  if (isMobile && !isPWA) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-6">
          <img
            src={logoVerde}
            alt="Soccer Vitae"
            className="h-7 w-auto object-contain mx-auto"
          />
          <p className="text-muted-foreground text-base">
            Para fazer login ou criar sua conta, baixe o app Soccer Vitae.
          </p>
          <Button
            onClick={() => setShowInstall(true)}
            className="w-full gap-2"
            size="lg"
          >
            <Download className="h-5 w-5" />
            Baixar App
          </Button>
        </div>

        <InstallInstructionsSheet
          open={showInstall}
          onOpenChange={setShowInstall}
        />
      </div>
    );
  }

  return <>{children}</>;
};

export default PwaOnlyGate;
