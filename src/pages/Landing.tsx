import { useRef, useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share, MoreVertical, Plus, Download, ClipboardList, Shield } from "lucide-react";
import { Icon } from "lucide-react";
import { soccerBall } from "@lucide/lab";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useScroll, useTransform } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import logoGreen from "@/assets/SOCCERVITAE_LOGO_NOVO_verde.png";
import { useIsPWA } from "@/hooks/useIsPWA";
import heroBannerProfessional from "@/assets/hero-banner-professional.jpg";
import DesktopLoginCard, { DesktopLoginCardRef } from "@/components/landing/DesktopLoginCard";

const useDeviceType = () => {
  return useMemo(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return "ios" as const;
    if (/android/.test(ua)) return "android" as const;
    return "unknown" as const;
  }, []);
};

const Landing = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isPWA = useIsPWA();
  const heroRef = useRef<HTMLElement>(null);
  const loginCardRef = useRef<DesktopLoginCardRef>(null);
  const [showInstallSheet, setShowInstallSheet] = useState(false);
  const deviceType = useDeviceType();
  const { isInstallable, promptInstall } = usePwaInstall();
  
  const { scrollY } = useScroll();


  return <>
      <Helmet>
        <title>SOCCER VITAE - A Rede Social do Atleta Profissional</title>
        <meta name="description" content="A plataforma definitiva para atletas mostrarem seu talento e encontrarem o time ideal." />
      </Helmet>
      
      <div className="min-h-screen bg-background text-foreground font-sans">

        {/* Hero Section - Split layout */}
        <section className="w-full relative overflow-hidden bg-[hsl(0,0%,8%)] min-h-screen">

          {/* Background image - full width */}
          <div className="absolute inset-0">
            <img 
              src={heroBannerProfessional} 
              alt="Jogadores disputando bola" 
              className="w-full h-full object-cover object-[60%_center] md:object-center"
              width={1920}
              height={1024}
            />
            <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-[hsl(0,0%,0%)]/85 via-[hsl(0,0%,0%)]/50 to-[hsl(0,0%,0%)]/30" />
          </div>

          {/* Hero content wrapper - two column grid on desktop */}
          <div className="relative z-20 grid md:grid-cols-2 items-center min-h-screen w-full">
            {/* Left content */}
            <div className="flex flex-col justify-center items-center md:items-start text-center md:text-left pt-14 pb-10 md:py-16 md:px-[96px] px-6">
              <img src={logoGreen} alt="SOCCER VITAE" className="h-6 md:h-10 w-auto mb-5 md:mb-6 mx-auto md:mx-0" />
              
              <h1 className="font-bold tracking-[0.15em] text-white/70 mb-3 py-[22px] text-center md:text-left text-xl md:text-3xl">
                Onde talentos
                <br />
                encontram oportunidades
              </h1>

              {/* Account types */}
              <div className="mb-6">
                <p className="text-sm md:text-base text-white/50 mb-3 tracking-wide">
                  Escolha o perfil que mais combina com você.
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <Icon iconNode={soccerBall} className="w-4 h-4 text-primary" />
                    <span className="text-xs md:text-sm text-white/80 font-medium">Atleta</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <ClipboardList className="w-4 h-4 text-primary" />
                    <span className="text-xs md:text-sm text-white/80 font-medium">Comissão Técnica</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-xs md:text-sm text-white/80 font-medium">Time de Futebol</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center md:justify-start gap-3">
                {isMobile ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/saiba-mais')}
                      className="border-transparent bg-white/15 text-white hover:bg-white/25 font-bold px-8 h-10 rounded text-sm tracking-wider uppercase"
                    >
                      Saiba Mais
                    </Button>
                    <Button
                      onClick={() => setShowInstallSheet(true)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-10 rounded text-sm tracking-wider uppercase"
                    >
                      Baixar App
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => loginCardRef.current?.switchToSignup()}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-10 rounded text-sm tracking-wider uppercase"
                    >
                      Começar Agora
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/saiba-mais')}
                      className="border-transparent bg-white/15 text-white hover:bg-white/25 font-bold px-8 h-10 rounded text-sm tracking-wider uppercase"
                    >
                      Saiba Mais
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Right column - Desktop login card */}
            <div className="hidden md:flex items-center justify-center">
              <DesktopLoginCard ref={loginCardRef} />
            </div>
          </div>

          {/* Bottom green accent bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-primary/80 to-transparent" />
        </section>



        {/* Install PWA Sheet */}
        <Sheet open={showInstallSheet} onOpenChange={setShowInstallSheet}>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <SheetHeader className="text-left mb-4">
              <SheetTitle className="text-lg font-bold">Como instalar o app</SheetTitle>
            </SheetHeader>

            {/* Native install button for Android */}
            {isInstallable && deviceType !== "ios" && (
              <div className="mb-6">
                <Button onClick={async () => { await promptInstall(); setShowInstallSheet(false); }} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 rounded-lg gap-2" size="lg">
                  <Download className="w-5 h-5" />
                  Instalar Agora
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">Ou siga os passos abaixo</p>
              </div>
            )}

            {/* iOS Instructions */}
            {(deviceType === "ios" || deviceType === "unknown") && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🍎</span>
                  <h3 className="font-semibold text-foreground">iPhone / iPad</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { step: 1, title: "Abra no Safari", desc: "Use o navegador Safari", icon: null },
                    { step: 2, title: "Toque em Compartilhar", desc: "Ícone na barra inferior", icon: Share },
                    { step: 3, title: "Adicionar à Tela Inicial", desc: "Role e selecione a opção", icon: Plus },
                    { step: 4, title: "Confirme", desc: "Toque em 'Adicionar'", icon: null },
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{item.step}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      {item.icon && <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Android Instructions */}
            {(deviceType === "android" || deviceType === "unknown") && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🤖</span>
                  <h3 className="font-semibold text-foreground">Android</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { step: 1, title: "Abra no Chrome", desc: "Use o Google Chrome", icon: null },
                    { step: 2, title: "Toque no menu", desc: "Três pontos (⋮)", icon: MoreVertical },
                    { step: 3, title: "Instalar aplicativo", desc: "Ou 'Adicionar à tela inicial'", icon: null },
                    { step: 4, title: "Confirme", desc: "Toque em 'Instalar'", icon: null },
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{item.step}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      {item.icon && <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              📱 Após instalar, abra o app pela tela inicial do seu celular
            </p>
          </SheetContent>
        </Sheet>

      </div>
    </>;
};
export default Landing;