import { Button } from "@/components/ui/button";
import { Search, Play, Eye, ChevronRight, User, MessageCircle, Film, Shield, Users, Trophy, Medal, Newspaper, Bell, Lock, Camera, Send, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import logoText from "@/assets/soccervitae-logo-text.png";
import clappingLanding from "@/assets/clapping-landing.png";

const Landing = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const features = [{
    icon: User,
    title: "Perfil",
    description: "Crie seu perfil completo com ano, posição, altura, peso, perna predominante e histórico de clubes."
  }, {
    icon: Newspaper,
    title: "Feed",
    description: "Compartilhe fotos e vídeos da sua carreira, treinos conquistas e as resenhas."
  }, {
    icon: Camera,
    title: "Replays",
    description: "Publique seus treinos, jogadas, lances e resenhas do dia a dia que ficam disponíveis por 24 horas."
  }, {
    icon: Film,
    title: "Destaques",
    description: "Crie álbuns permanentes com seus melhores momentos, gols e jogadas para mostrar seu talento."
  }, {
    icon: MessageCircle,
    title: "Mensagens Diretas",
    description: "Converse no chat com jogadores e treinadores que fazem parte da SOCCER VITAE e aumente sua rede de contatos."
  }, {
    icon: Shield,
    title: "Times",
    description: "Adicione todos os clubes por onde passou e construa sua trajetória completa."
  }, {
    icon: Trophy,
    title: "Campeonatos",
    description: "Registre os campeonatos disputados, gols marcados, jogos e colocação alcançada."
  }, {
    icon: Medal,
    title: "Conquistas",
    description: "Exiba suas medalhas, títulos e prêmios individuais conquistados ao longo da carreira."
  }, {
    icon: Users,
    title: "Torcedores",
    description: "Construa sua base de fãs. Acompanhe quem torce por você e quem você está torcendo."
  }, {
    icon: Search,
    title: "Explorar",
    description: "Descubra novos atletas, busque por posição, região ou habilidades específicas."
  }, {
    icon: Bell,
    title: "Notificações",
    description: "Receba alertas em tempo real sobre curtidas, comentários, novos torcedores e mensagens."
  }, {
    icon: null,
    customIcon: clappingLanding,
    title: "Aplausos",
    description: "Interaja com publicações através do sistema de aplausos exclusivo da plataforma."
  }, {
    icon: Send,
    title: "Compartilhamento",
    description: "Envie posts, perfis e destaques diretamente para conversas no chat."
  }, {
    icon: MapPin,
    title: "Localização",
    description: "Adicione localização às suas publicações para mostrar onde você está jogando, treinando ou resenhando."
  }, {
    icon: Lock,
    title: "Privacidade",
    description: "Controle quem pode ver seu perfil, status de atividade e configure autenticação em duas etapas."
  }];
  return <>
      <Helmet>
        <title>SOCCER VITAE - A Rede Social do Atleta Profissional</title>
        <meta name="description" content="A plataforma definitiva para atletas mostrarem seu talento e encontrarem o time ideal." />
      </Helmet>
      
      <div className="min-h-screen bg-[#102216] text-white font-sans">

        {/* Hero Section */}
        <section className="w-full">
          <div>
            <div className="relative flex min-h-[320px] flex-col gap-6 md:gap-8 items-center justify-center p-4 overflow-hidden bg-cover bg-center bg-no-repeat" style={{
            backgroundImage: `linear-gradient(to top, rgba(16, 34, 22, 1) 0%, rgba(16, 34, 22, 0.6) 40%, rgba(16, 34, 22, 0.2) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuDT2pTn64tn7UxRaCLdSIqqE1y1Z0AYtCLNTzIggqae4i-MIj4O3l7tX9caZtZ7ZqPJ9QY47044d0PP8IK4sV2NLRz7RxAWknfxoUNw7M8eVGGAGOW7fPI0iPg6KxJ71fbDC5TH4Qt0Q4T-BEbTrHCkhmwDXJi05EtfmMPuOaMIHy7Z09KCn6Z5BtGiShd8QAjXzkpNoVOx_AWfXpZ-5gYFtHpXhhNDtbJ1MBjtiTDfcGIth28u2rz08qXv_bZgIe8pxPwJnzQvf4E")`
          }}>
              <div className="flex flex-col gap-4 text-center z-10 max-w-[600px]">
                <h1 className="text-white text-4xl md:text-6xl font-black leading-tight tracking-tight uppercase">
                  Jogue.
                  <br />
                  Brilhe.
                  <br />
                  Conquiste.
                </h1>
                <p className="text-white/80 text-base md:text-lg">
                  Mostre seu talento e conecte-se com o mundo do futebol.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-8 px-4 max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center gap-4 mb-12">
            <p className="text-[#1cb15c] text-sm font-medium uppercase tracking-wider">
              Recursos Principais
            </p>
            <h2 className="text-white text-3xl md:text-4xl font-black max-w-[720px]">
              Tudo que você precisa para evoluir
            </h2>
            <p className="text-white/60 text-base max-w-[720px]">
              Ferramentas profissionais desenhadas especificamente para o ecossistema do futebol amador e profissional.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {features.map((feature, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true,
            margin: "-50px"
          }} transition={{
            duration: 0.5,
            delay: index * 0.05,
            ease: [0.25, 0.1, 0.25, 1]
          }} whileHover={{
            scale: 1.02,
            y: -4
          }} className="flex flex-col items-center text-center gap-4 rounded-xl border border-white/10 bg-[#1a3d26] p-6 hover:border-[#1cb15c]/50 transition-colors">
                <motion.div className="w-12 h-12 rounded-full bg-[#1cb15c]/20 flex items-center justify-center" whileHover={{
              rotate: 10,
              scale: 1.1
            }} transition={{
              type: "spring",
              stiffness: 300
            }}>
                  {feature.customIcon ? (
                    <img src={feature.customIcon} alt={feature.title} className="w-6 h-6" />
                  ) : (
                    <feature.icon className="w-6 h-6 text-[#1cb15c]" />
                  )}
                </motion.div>
                <h3 className="text-white text-lg font-bold">{feature.title}</h3>
                <p className="text-white/60 text-sm">
                  {feature.description}
                </p>
              </motion.div>)}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-white text-2xl md:text-3xl font-black mb-4">
              Pronto para entrar em campo?
            </h2>
            <p className="text-white/60 mb-8">
              Junte-se a milhares de jogadores e comece sua jornada profissional hoje.
            </p>
            {isMobile ? (
              <Button onClick={() => navigate("/install")} className="bg-[#1cb15c] hover:bg-[#1cb15c]/90 text-white font-medium px-8 h-12 rounded-full">
                Baixar App
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button onClick={() => navigate("/auth")} className="bg-[#1cb15c] hover:bg-[#1cb15c]/90 text-white font-medium px-8 h-12 rounded-full">
                Cadastrar
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8 px-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={logoText} alt="SOCCER VITAE" className="h-6" />
            </div>
            <div className="flex gap-6 text-white/60 text-sm">
              <a href="#" className="hover:text-white transition-colors">Termos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Suporte</a>
            </div>
            <p className="text-white/40 text-xs">
              © {new Date().getFullYear()} SOCCER VITAE. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </div>
    </>;
};
export default Landing;