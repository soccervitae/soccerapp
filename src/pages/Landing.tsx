import { useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Search, Play, Eye, ChevronRight, User, MessageCircle, Film, Shield, Users, Trophy, Medal, Newspaper, Bell, Lock, Camera, Send, MapPin, type LucideIcon, ClipboardList, UserPlus, Share, MoreVertical, Plus, Download } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, useScroll, useTransform } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import logoText from "@/assets/soccervitae-logo-text.png";
import stadiumHero from "@/assets/soccer-player-hero.jpg";
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
      customEmoji: playerKickingIcon,
      accountType: "Atleta",
      accountDescription: "Crie seu currículo esportivo e mostre seu talento para o mundo.",
      features: [
        { icon: User, title: "Perfil Completo", description: "Ano, posição, altura, peso, perna predominante e histórico de clubes." },
        { icon: Newspaper, title: "Feed", description: "Compartilhe fotos e vídeos da sua carreira, treinos e conquistas." },
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
      customEmoji: footballFieldIcon,
      accountType: "Comissão Técnica",
      accountDescription: "Treinadores, preparadores físicos e auxiliares podem criar seu perfil profissional.",
      features: [
        { icon: User, title: "Perfil Profissional", description: "Crie seu perfil com função, histórico e experiência." },
        { icon: Newspaper, title: "Feed", description: "Compartilhe conteúdo sobre treinos, táticas e bastidores." },
        { icon: Camera, title: "Replays", description: "Publique momentos do dia a dia que ficam disponíveis por 24 horas." },
        { icon: Film, title: "Destaques", description: "Álbuns permanentes com seus melhores momentos profissionais." },
        { icon: MessageCircle, title: "Mensagens", description: "Converse com atletas e outros profissionais." },
        { icon: Users, title: "Torcedores", description: "Acompanhe quem segue seu trabalho." },
      ],
    },
    {
      emoji: "🛡️",
      accountType: "Time de Futebol",
      accountDescription: "Clubes e equipes com presença na plataforma.",
      features: [
        { icon: User, title: "Perfil do Clube", description: "Página oficial com escudo, informações e história." },
        { icon: Newspaper, title: "Feed", description: "Compartilhe novidades, resultados e bastidores do clube." },
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
      
      <div className="min-h-screen bg-white text-foreground font-sans">

        {/* Banner Slide */}
        <section className="w-full relative overflow-hidden h-[280px] md:h-[360px]">
          <SoccerShowcase banner />
        </section>

        {/* Hero Content */}
        <section className="py-10 px-4">
          <motion.div 
            className="flex flex-col gap-4 text-center items-center max-w-[600px] mx-auto"
            style={{ opacity }}
          >
            <img src={logoText} alt="SOCCER VITAE" className="h-10 md:h-14" />
            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight my-0 py-[16px] text-primary">
              Onde talentos encontram oportunidades
            </h1>
          </motion.div>
        </section>

        {/* Account Types Section */}
        <section className="py-12 px-4 max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center gap-4 mb-10">
            <p className="text-primary text-sm font-medium uppercase tracking-wider">
              Para Todos do Futebol
            </p>
            <h2 className="text-3xl md:text-4xl font-black max-w-[720px] text-primary">
              Crie sua conta e faça parte
            </h2>
            <p className="text-muted-foreground text-base max-w-[720px]">
              A SOCCER VITAE é para todos que vivem o futebol. Escolha o perfil que mais combina com você.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-5">
            {featuresByAccount.map((type, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center gap-4 rounded-xl border border-border/40 bg-card shadow-sm p-6 hover:border-primary/30 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                  {type.customEmoji ? (
                    <img src={type.customEmoji} alt={type.accountType} className="w-11 h-11" loading="lazy" />
                  ) : (
                    type.emoji
                  )}
                </div>
                <h3 className="text-foreground text-lg font-bold">{type.accountType}</h3>
                <p className="text-muted-foreground text-sm">{type.accountDescription}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features by Account Type */}
        <section className="py-8 px-4 max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center gap-4 mb-12">
            <p className="text-primary text-sm font-medium uppercase tracking-wider">
              Recursos Principais
            </p>
            <h2 className="text-foreground text-3xl md:text-4xl font-black max-w-[720px]">
              O que cada conta oferece
            </h2>
            <p className="text-muted-foreground text-base max-w-[720px]">
              Ferramentas profissionais desenhadas para cada tipo de perfil no ecossistema do futebol.
            </p>
          </div>

          <div className="flex flex-col gap-12">
            {featuresByAccount.map((account, idx) => (
              <div key={idx}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                    {account.customEmoji ? (
                      <img src={account.customEmoji} alt={account.accountType} className="w-6 h-6" loading="lazy" />
                    ) : (
                      account.emoji
                    )}
                  </div>
                  <h3 className="text-foreground text-xl font-bold">{account.accountType}</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {account.features.map((feature, fIdx) => (
                    <div
                      key={fIdx}
                      className="flex flex-col gap-2 rounded-lg border border-border/30 bg-card p-4 hover:border-primary/20 transition-all"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <feature.icon className="w-4 h-4 text-primary" />
                      </div>
                      <h4 className="text-foreground text-sm font-semibold">{feature.title}</h4>
                      <p className="text-muted-foreground text-xs leading-relaxed">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Shared Features */}
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                ✨
              </div>
              <h3 className="text-foreground text-xl font-bold">Disponível para todos</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {sharedFeatures.map((feature, fIdx) => (
                <div
                  key={fIdx}
                  className="flex flex-col gap-2 rounded-lg border border-border/30 bg-card p-4 hover:border-primary/20 transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    {feature.customIcon ? (
                      <img src={feature.customIcon} alt={feature.title} className="w-4 h-4" />
                    ) : feature.icon ? (
                      <feature.icon className="w-4 h-4 text-primary" />
                    ) : null}
                  </div>
                  <h4 className="text-foreground text-sm font-semibold">{feature.title}</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-foreground text-2xl md:text-3xl font-black mb-4">
              Pronto para entrar em campo?
            </h2>
            <p className="text-muted-foreground mb-8">
              Junte-se e comece sua jornada profissional hoje.
            </p>
            {isMobile ? (
              <Button onClick={() => setShowInstallSheet(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 h-12 rounded-lg">
                Baixar App
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 h-12 rounded-lg">
                Cadastrar
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </div>
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
              <img src={logoText} alt="SOCCER VITAE" className="h-6" />
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