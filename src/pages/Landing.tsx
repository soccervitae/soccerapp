import { useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Search, Play, Eye, ChevronRight, User, MessageCircle, Film, Shield, Users, Trophy, Medal, Newspaper, Bell, Lock, Camera, Send, MapPin, type LucideIcon, ClipboardList, UserPlus, Share, MoreVertical, Plus, Download, Shirt, Icon } from "lucide-react";
import { soccerBall } from "@lucide/lab";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, useScroll, useTransform } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import logoWhite from "@/assets/SOCCERVITAE_LOGO_NOVO.png";
import logoGreen from "@/assets/SOCCERVITAE_LOGO_NOVO_verde.png";
import stadiumHero from "@/assets/soccer-player-hero.jpg";
import heroBannerProfessional from "@/assets/hero-banner-professional.jpg";
import clappingLanding from "@/assets/clapping-landing.png";
import playerKickingIcon from "@/assets/player-kicking-icon.png";
import footballFieldIcon from "@/assets/football-field-icon.png";
import SoccerShowcase from "@/components/common/SoccerShowcase";

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
  const heroRef = useRef<HTMLElement>(null);
  const [showInstallSheet, setShowInstallSheet] = useState(false);
  const deviceType = useDeviceType();
  const { isInstallable, promptInstall } = usePwaInstall();
  
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.3]);
  const featuresByAccount = [
    {
      emoji: "",
      customIconNode: soccerBall,
      accountType: "Atleta",
      accountDescription: "Crie seu currículo esportivo e mostre seu talento para o mundo.",
      features: [
        { icon: User, title: "Perfil Completo", description: "Ano, posição, altura, peso, perna predominante e histórico de clubes." },
        { icon: Newspaper, title: "Feed", description: "Compartilhe fotos e vídeos da sua carreira, treinos e conquistas." },
        { icon: Play, title: "Vídeos", description: "Publique vídeos de jogos, treinos e lances marcantes." },
        { icon: Camera, title: "Replays", description: "Publique treinos e jogadas que ficam disponíveis por 24 horas." },
        { icon: Film, title: "Destaques", description: "Álbuns permanentes com seus melhores momentos e gols." },
        { icon: Shield, title: "Times", description: "Adicione todos os clubes por onde passou." },
        { icon: Trophy, title: "Campeonatos", description: "Registre campeonatos, gols marcados e colocação." },
        { icon: Medal, title: "Conquistas", description: "Exiba medalhas, títulos e prêmios individuais." },
        { icon: Users, title: "Torcedores", description: "Construa sua base de fãs e acompanhe quem torce por você." },
      ],
    },
    {
      emoji: "",
      customIcon: ClipboardList,
      accountType: "Comissão Técnica",
      accountDescription: "Treinadores, preparadores físicos e auxiliares podem criar seu perfil profissional.",
      features: [
        { icon: User, title: "Perfil Profissional", description: "Crie seu perfil com função, histórico e experiência." },
        { icon: Newspaper, title: "Feed", description: "Compartilhe conteúdo sobre treinos, táticas e bastidores." },
        { icon: Play, title: "Vídeos", description: "Publique vídeos de treinos, táticas e bastidores." },
        { icon: Camera, title: "Replays", description: "Publique momentos do dia a dia que ficam disponíveis por 24 horas." },
        { icon: Film, title: "Destaques", description: "Álbuns permanentes com seus melhores momentos profissionais." },
        { icon: MessageCircle, title: "Mensagens", description: "Converse com atletas e outros profissionais." },
        { icon: Users, title: "Torcedores", description: "Acompanhe quem segue seu trabalho." },
      ],
    },
    {
      emoji: "",
      customIcon: Shield,
      accountType: "Time de Futebol",
      accountDescription: "Clubes e equipes com presença na plataforma.",
      features: [
        { icon: User, title: "Perfil do Clube", description: "Página oficial com escudo, informações e história." },
        { icon: Newspaper, title: "Feed", description: "Compartilhe novidades, resultados e bastidores do clube." },
        { icon: Play, title: "Vídeos", description: "Publique vídeos de jogos, gols e momentos do clube." },
        { icon: Camera, title: "Replays", description: "Publique momentos dos jogos e treinos por 24 horas." },
        { icon: Film, title: "Destaques", description: "Álbuns permanentes com os melhores momentos do time." },
        { icon: UserPlus, title: "Elenco", description: "Gerencie o elenco e receba solicitações de atletas." },
        { icon: Search, title: "Buscar Talentos", description: "Encontre novos atletas por posição e região." },
      ],
    },
  ];

  const sharedFeatures = [
    { icon: MessageCircle, title: "Mensagens Diretas", description: "Converse no chat com outros usuários da plataforma." },
    { icon: Bell, title: "Notificações", description: "Alertas em tempo real sobre curtidas, comentários e mensagens." },
    { icon: null as LucideIcon | null, customIcon: clappingLanding, title: "Aplausos", description: "Interaja com publicações através do sistema exclusivo de aplausos." },
    { icon: Send, title: "Compartilhamento", description: "Envie posts, perfis e destaques diretamente para conversas." },
    { icon: MapPin, title: "Localização", description: "Adicione localização às suas publicações." },
    { icon: Lock, title: "Privacidade", description: "Controle quem pode ver seu perfil e configure segurança." },
    { icon: Search, title: "Explorar", description: "Descubra novos perfis por posição, região ou habilidades." },
  ];

  return <>
      <Helmet>
        <title>SOCCER VITAE - A Rede Social do Atleta Profissional</title>
        <meta name="description" content="A plataforma definitiva para atletas mostrarem seu talento e encontrarem o time ideal." />
      </Helmet>
      
      <div className="min-h-screen bg-background text-foreground font-sans">

        {/* Hero Section - Split layout */}
        <section className="w-full relative overflow-hidden bg-[hsl(0,0%,8%)] min-h-[280px] md:min-h-[420px]">

          {/* Background image - full width */}
          <div className="absolute inset-0">
            <img 
              src={heroBannerProfessional} 
              alt="Jogadores disputando bola" 
              className="w-full h-full object-cover object-center"
              width={1920}
              height={1024}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(0,0%,0%)]/85 via-[hsl(0,0%,0%)]/50 to-[hsl(0,0%,0%)]/30" />
          </div>

          {/* Hero content - left side */}
          <div className="relative z-20 flex flex-col justify-center px-8 md:px-16 pt-14 pb-10 md:py-16 max-w-[550px] min-h-[280px] md:min-h-[420px]">
            <img src={logoGreen} alt="SOCCER VITAE" className="h-6 md:h-10 w-fit mb-5 md:mb-6" />
            
            <h1 className="text-3xl md:text-5xl font-black italic leading-[0.9] tracking-tight text-white uppercase mb-3">
              Soccer
              <br />
              <span className="text-white/70 text-xl md:text-3xl font-bold tracking-[0.15em] not-italic">
                Vitae
              </span>
            </h1>


            <div className="flex gap-3">
              {isMobile ? (
                <Button
                  onClick={() => setShowInstallSheet(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-10 rounded text-sm tracking-wider uppercase"
                >
                  Baixar App
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => navigate('/auth')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-10 rounded text-sm tracking-wider uppercase"
                  >
                    Começar Agora
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/saiba-mais')}
                    className="border-white/30 text-white hover:bg-white/10 font-bold px-8 h-10 rounded text-sm tracking-wider uppercase"
                  >
                    Saiba Mais
                  </Button>
                </>
              )}
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

        {/* Footer */}
        <footer className="border-t border-border/30 py-8 px-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={logoGreen} alt="SOCCER VITAE" className="h-4" />
            </div>
            <div className="flex gap-6 text-muted-foreground text-sm">
              <a href="/sobre" className="hover:text-foreground transition-colors">Sobre</a>
              <a href="/terms" className="hover:text-foreground transition-colors">Termos</a>
              <a href="/privacy-policy" className="hover:text-foreground transition-colors">Privacidade</a>
              <a href="#" className="hover:text-foreground transition-colors">Suporte</a>
            </div>
            <p className="text-muted-foreground/60 text-xs">
              © {new Date().getFullYear()} SOCCER VITAE. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </div>
    </>;
};
export default Landing;