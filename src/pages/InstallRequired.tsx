import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useIsPWA } from "@/hooks/useIsPWA";
import { useAuth } from "@/contexts/AuthContext";
import { Download, Smartphone, Share, MoreVertical, Plus, CheckCircle2, RefreshCw, LogOut } from "lucide-react";
import logo from "@/assets/soccer-vitae-logo.png";
import logoText from "@/assets/soccervitae-logo-text.png";
const InstallRequired = () => {
  const navigate = useNavigate();
  const {
    signOut
  } = useAuth();
  const {
    promptInstall,
    isIOS,
    hasNativePrompt
  } = usePwaInstall();
  const isPWA = useIsPWA();
  const [isChecking, setIsChecking] = useState(false);

  // If already in PWA, redirect to home
  useEffect(() => {
    if (isPWA) {
      navigate("/", {
        replace: true
      });
    }
  }, [isPWA, navigate]);
  const handleInstall = async () => {
    if (hasNativePrompt) {
      await promptInstall();
    }
  };
  const handleCheckAgain = () => {
    setIsChecking(true);
    // Force reload to recheck PWA status
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  const handleLogout = async () => {
    await signOut();
    navigate("/auth", {
      replace: true
    });
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex flex-col">
      {/* Header */}
      <div className="p-4 flex justify-end">
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* App Icon */}
        

        {/* Logo Text */}
        <img src={logoText} alt="Soccer Vitae" className="h-8 mb-6 object-contain" />

        {/* Title */}
        
        <p className="text-muted-foreground text-center mb-8 max-w-xs">
          Para uma melhor experiência, instale nosso app na tela inicial do seu dispositivo
        </p>

        {/* Benefits */}
        <div className="w-full max-w-sm mb-8 space-y-3">
          <div className="flex items-center gap-3 bg-card/50 rounded-lg p-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-sm text-foreground">Acesso rápido pela tela inicial</span>
          </div>
          <div className="flex items-center gap-3 bg-card/50 rounded-lg p-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-sm text-foreground">Notificações em tempo real</span>
          </div>
          <div className="flex items-center gap-3 bg-card/50 rounded-lg p-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-sm text-foreground">Funciona mesmo offline</span>
          </div>
        </div>

        {/* Install Button (Android/Desktop with native prompt) */}
        {hasNativePrompt && <Button size="lg" onClick={handleInstall} className="w-full max-w-sm mb-6 h-14 text-lg font-semibold">
            <Download className="h-5 w-5 mr-2" />
            Instalar Agora
          </Button>}

        {/* Instructions */}
        <div className="w-full max-w-sm space-y-4">
          {/* iOS Instructions */}
          {isIOS && <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">iPhone / iPad (Safari)</h3>
              </div>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                  <span>Toque no botão <Share className="inline h-4 w-4 mx-1" /> Compartilhar na barra do Safari</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                  <span>Role para baixo e toque em <Plus className="inline h-4 w-4 mx-1" /> "Adicionar à Tela de Início"</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                  <span>Toque em "Adicionar" no canto superior direito</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                  <span>Abra o app pela tela inicial</span>
                </li>
              </ol>
            </div>}

          {/* Android Instructions (when no native prompt) */}
          {!isIOS && !hasNativePrompt && <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Android (Chrome)</h3>
              </div>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                  <span>Toque no menu <MoreVertical className="inline h-4 w-4 mx-1" /> no canto superior direito</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                  <span>Toque em "Instalar app" ou "Adicionar à tela inicial"</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                  <span>Confirme tocando em "Instalar"</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                  <span>Abra o app pela tela inicial</span>
                </li>
              </ol>
            </div>}
        </div>

        {/* Check Again Button */}
        <Button variant="outline" onClick={handleCheckAgain} disabled={isChecking} className="mt-6 w-full max-w-sm">
          {isChecking ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Já instalei, verificar
        </Button>
      </div>

      {/* Footer */}
      <div className="p-6 text-center">
        <p className="text-xs text-muted-foreground">
          Após instalar, abra o app pela tela inicial para continuar
        </p>
      </div>
    </div>;
};
export default InstallRequired;