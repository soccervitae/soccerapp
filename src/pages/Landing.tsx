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
import clappingLanding from "@/assets/clapping-landing.png";

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
      emoji: "⚽",
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
      emoji: "📋",
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
      emoji: "🏟️",
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
    {
      emoji: "🎓",
      accountType: "Escolinha de Futebol",
      accountDescription: "Escolas de futebol divulgando seu trabalho e resultados.",
      features: [
        { icon: User, title: "Perfil da Escola", description: "Página oficial com informações e metodologia." },
        { icon: Newspaper, title: "Feed", description: "Compartilhe treinos, eventos e resultados dos alunos." },
        { icon: Camera, title: "Replays", description: "Publique momentos das aulas e jogos por 24 horas." },
        { icon: Film, title: "Destaques", description: "Álbuns permanentes com os melhores momentos." },
        { icon: UserPlus, title: "Elenco", description: "Gerencie os alunos matriculados na escolinha." },
        { icon: Users, title: "Comunidade", description: "Atraia novos alunos e construa sua comunidade." },
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

        {/* Hero Section with Parallax */}
        <section ref={heroRef} className="w-full relative overflow-hidden min-h-[320px] md:min-h-[400px]">
          {/* Parallax Background */}
          <motion.div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuDT2pTn64tn7UxRaCLdSIqqE1y1Z0AYtCLNTzIggqae4i-MIj4O3l7tX9caZtZ7ZqPJ9QY47044d0PP8IK4sV2NLRz7RxAWknfxoUNw7M8eVGGAGOW7fPI0iPg6KxJ71fbDC5TH4Qt0Q4T-BEbTrHCkhmwDXJi05EtfmMPuOaMIHy7Z09KCn6Z5BtGiShd8QAjXzkpNoVOx_AWfXpZ-5gYFtHpXhhNDtbJ1MBjtiTDfcGIth28u2rz08qXv_bZgIe8pxPwJnzQvf4E")`,
              y: backgroundY,
              scale: 1.1,
            }}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-white/20" />
          
          {/* Content */}
          <motion.div 
            className="relative flex min-h-[320px] md:min-h-[400px] flex-col gap-6 md:gap-8 items-center justify-center p-4"
            style={{ opacity }}
          >
            <div className="flex flex-col gap-4 text-center z-10 max-w-[600px]">
              <h1 className="text-foreground text-4xl md:text-6xl font-black leading-tight tracking-tight uppercase">
                Jogue.
                <br />
                Brilhe.
                <br />
                Conquiste.
              </h1>
              <p className="text-muted-foreground text-base md:text-lg">
                Mostre seu talento e conecte-se com o mundo do futebol.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Account Types Section */}
        <section className="py-12 px-4 max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center gap-4 mb-10">
            <p className="text-primary text-sm font-medium uppercase tracking-wider">
              Para Todos do Futebol
            </p>
            <h2 className="text-foreground text-3xl md:text-4xl font-black max-w-[720px]">
              Crie sua conta e faça parte
            </h2>
            <p className="text-muted-foreground text-base max-w-[720px]">
              A SOCCER VITAE é para todos que vivem o futebol. Escolha o perfil que mais combina com você.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuresByAccount.map((type, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center gap-4 rounded-xl border border-border/40 bg-card shadow-sm p-6 hover:border-primary/30 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                  {type.emoji}
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
                    {account.emoji}
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