import { ReactNode } from "react";
import { useIsPWA } from "@/hooks/useIsPWA";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface PwaOnlyGateProps {
  children: ReactNode;
}

const PwaOnlyGate = ({ children }: PwaOnlyGateProps) => {
  const isPWA = useIsPWA();
  const navigate = useNavigate();

  if (!isPWA) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-6">
          <img
            src="/SOCCERVITAE_LOGO_NOVO_verde.png"
            alt="Soccer Vitae"
            className="h-10 mx-auto"
          />
          <p className="text-muted-foreground text-base">
            Para fazer login ou criar sua conta, baixe o app Soccer Vitae.
          </p>
          <Button
            onClick={() => navigate("/install")}
            className="w-full gap-2"
            size="lg"
          >
            <Download className="h-5 w-5" />
            Baixar App
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PwaOnlyGate;
