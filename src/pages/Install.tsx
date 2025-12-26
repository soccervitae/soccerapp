import { ArrowLeft, Download, Share, MoreVertical, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";

const Install = () => {
  const navigate = useNavigate();
  const { isInstallable, isInstalled, promptInstall } = usePwaInstall();

  const handleInstall = async () => {
    await promptInstall();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">Instalar App</h1>
        </div>
      </header>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Download className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">SOCCER VITAE</h2>
            <p className="text-muted-foreground mt-1">
              Instale o app para uma experiência completa
            </p>
          </div>
        </div>

        {/* Direct Install Button (Android/Desktop) */}
        {isInstallable && !isInstalled && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Instalação rápida disponível</p>
                <p className="text-sm text-muted-foreground">Clique para instalar agora</p>
              </div>
            </div>
            <Button onClick={handleInstall} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Instalar Agora
            </Button>
          </div>
        )}

        {isInstalled && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
            <p className="font-medium text-primary">✓ App já instalado!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Você pode acessar o SOCCER VITAE pela sua tela inicial
            </p>
          </div>
        )}

        {/* iOS Instructions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-lg">
              🍎
            </div>
            <h3 className="font-semibold text-lg">iPhone / iPad</h3>
          </div>

          <div className="space-y-4 pl-2">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-medium">Abra no Safari</p>
                <p className="text-sm text-muted-foreground">
                  Certifique-se de estar usando o navegador Safari
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-medium">Toque no botão Compartilhar</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Share className="w-4 h-4" />
                  </div>
                  <span>Na barra inferior do Safari</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-medium">Selecione "Adicionar à Tela Inicial"</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span>Role para baixo se necessário</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-medium">Confirme tocando "Adicionar"</p>
                <p className="text-sm text-muted-foreground">
                  O ícone do app aparecerá na sua tela inicial
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Android Instructions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-lg">
              🤖
            </div>
            <h3 className="font-semibold text-lg">Android</h3>
          </div>

          <div className="space-y-4 pl-2">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-medium">Abra no Chrome</p>
                <p className="text-sm text-muted-foreground">
                  Use o navegador Google Chrome
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-medium">Toque no menu (⋮)</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <MoreVertical className="w-4 h-4" />
                  </div>
                  <span>Três pontos no canto superior direito</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-medium">Selecione "Instalar app" ou "Adicionar à tela inicial"</p>
                <p className="text-sm text-muted-foreground">
                  A opção pode variar conforme a versão do Chrome
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-medium">Confirme a instalação</p>
                <p className="text-sm text-muted-foreground">
                  O app será instalado e aparecerá na sua gaveta de apps
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold">Vantagens do app instalado</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              Acesso rápido pela tela inicial
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              Experiência em tela cheia
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              Notificações push
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              Funciona offline (recursos básicos)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Install;
