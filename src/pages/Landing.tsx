import { Button } from "@/components/ui/button";
import { 
  Search, 
  Play, 
  Eye, 
  ChevronRight, 
  User, 
  MessageCircle, 
  Film, 
  Shield, 
  Users, 
  Trophy, 
  Medal, 
  Newspaper, 
  Bell, 
  Lock, 
  Camera, 
  Heart,
  Share2,
  MapPin,
  UserPlus,
  Sparkles,
  Rocket
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import logoText from "@/assets/soccervitae-logo-text.png";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: User,
      title: "Perfil Profissional",
      description: "Crie seu currículo esportivo completo com foto, posição, altura, peso, pé preferido e histórico de clubes."
    },
    {
      icon: Newspaper,
      title: "Feed de Publicações",
      description: "Compartilhe fotos e vídeos da sua carreira, treinos e conquistas com toda a comunidade."
    },
    {
      icon: Camera,
      title: "Replays (Stories)",
      description: "Publique momentos do dia a dia que ficam disponíveis por 24 horas para seus torcedores."
    },
    {
      icon: Film,
      title: "Destaques",
      description: "Crie álbuns permanentes com seus melhores momentos, gols e jogadas para mostrar seu talento."
    },
    {
      icon: MessageCircle,
      title: "Mensagens Diretas",
      description: "Converse em tempo real com atletas, técnicos e olheiros. Envie textos, fotos, áudios e vídeos."
    },
    {
      icon: Shield,
      title: "Histórico de Times",
      description: "Adicione todos os clubes por onde passou e construa sua trajetória profissional completa."
    },
    {
      icon: Trophy,
      title: "Campeonatos",
      description: "Registre os campeonatos disputados, gols marcados, jogos e colocação alcançada."
    },
    {
      icon: Medal,
      title: "Conquistas",
      description: "Exiba suas medalhas, títulos e prêmios individuais conquistados ao longo da carreira."
    },
    {
      icon: Users,
      title: "Torcedores",
      description: "Construa sua base de fãs. Acompanhe quem torce por você e quem você está torcendo."
    },
    {
      icon: Search,
      title: "Explorar",
      description: "Descubra novos atletas, busque por posição, região ou habilidades específicas."
    },
    {
      icon: Eye,
      title: "Conecte-se com Olheiros",
      description: "Seu perfil pode ser visto por recrutadores de clubes profissionais em busca de talentos."
    },
    {
      icon: Bell,
      title: "Notificações",
      description: "Receba alertas em tempo real sobre curtidas, comentários, novos torcedores e mensagens."
    },
    {
      icon: Heart,
      title: "Curtidas e Aplausos",
      description: "Interaja com publicações através do sistema de aplausos exclusivo da plataforma."
    },
    {
      icon: Share2,
      title: "Compartilhamento",
      description: "Envie posts, perfis e destaques diretamente para conversas ou redes sociais externas."
    },
    {
      icon: MapPin,
      title: "Localização",
      description: "Adicione localização às suas publicações para mostrar onde você está jogando."
    },
    {
      icon: Lock,
      title: "Privacidade",
      description: "Controle quem pode ver seu perfil, status de atividade e configure autenticação em duas etapas."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Soccer Vitae - A Rede Social do Atleta Profissional</title>
        <meta
          name="description"
          content="A plataforma definitiva para atletas mostrarem seu talento e encontrarem o time ideal."
        />
      </Helmet>
      
      <div className="min-h-screen bg-[#102216] text-white font-sans overflow-x-hidden">
        {/* Hero Section */}
        <section className="w-full">
          <div className="p-0 md:p-4">
            <div
              className="relative flex min-h-[560px] flex-col gap-6 md:gap-8 md:rounded-xl items-center justify-center pt-16 p-4 overflow-hidden bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `linear-gradient(to top, rgba(16, 34, 22, 1) 0%, rgba(16, 34, 22, 0.6) 40%, rgba(16, 34, 22, 0.2) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuDT2pTn64tn7UxRaCLdSIqqE1y1Z0AYtCLNTzIggqae4i-MIj4O3l7tX9caZtZ7ZqPJ9QY47044d0PP8IK4sV2NLRz7RxAWknfxoUNw7M8eVGGAGOW7fPI0iPg6KxJ71fbDC5TH4Qt0Q4T-BEbTrHCkhmwDXJi05EtfmMPuOaMIHy7Z09KCn6Z5BtGiShd8QAjXzkpNoVOx_AWfXpZ-5gYFtHpXhhNDtbJ1MBjtiTDfcGIth28u2rz08qXv_bZgIe8pxPwJnzQvf4E")`
              }}
            >
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex flex-col gap-4 text-center z-10 max-w-[600px]"
              >
                <h1 className="text-white text-4xl md:text-6xl font-black leading-tight tracking-tight uppercase">
                  Conecte-se.
                  <br />
                  Compita.
                  <br />
                  Conquiste.
                </h1>
                <p className="text-white/80 text-base md:text-lg">
                  A plataforma definitiva para atletas mostrarem seu talento e encontrarem o time ideal.
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="flex gap-3 z-10"
              >
                <Button
                  onClick={() => navigate("/auth")}
                  className="bg-[#1cb15c] hover:bg-[#1cb15c]/90 text-white font-medium px-6 h-12 rounded-full"
                >
                  Criar Perfil Grátis
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="py-8 px-4"
        >
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { value: "50k+", label: "Atletas" },
              { value: "2k+", label: "Clubes" },
              { value: "500+", label: "Olheiros" }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                variants={scaleIn}
                className="flex flex-col items-center"
              >
                <span className="text-[#1cb15c] text-4xl font-black">{stat.value}</span>
                <span className="text-white/60 text-sm">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* How It Works Section */}
        <section className="py-16 px-4 max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="flex flex-col gap-4 mb-12 text-center"
          >
            <p className="text-[#1cb15c] text-sm font-medium uppercase tracking-wider">
              Como Funciona
            </p>
            <h2 className="text-white text-3xl md:text-4xl font-black">
              Comece sua jornada em 3 passos
            </h2>
            <p className="text-white/60 text-base max-w-[600px] mx-auto">
              É simples e rápido começar a usar a Soccer Vitae e conectar-se com a comunidade do futebol.
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Step 1 */}
            <motion.div variants={itemVariants} className="relative flex flex-col items-center text-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-[#1cb15c]/20 flex items-center justify-center border-2 border-[#1cb15c]">
                  <UserPlus className="w-10 h-10 text-[#1cb15c]" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#1cb15c] flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
              </div>
              <h3 className="text-white text-xl font-bold">Crie sua Conta</h3>
              <p className="text-white/60 text-sm max-w-[280px]">
                Cadastre-se gratuitamente com seu e-mail. É rápido e você já pode começar a explorar a plataforma.
              </p>
              {/* Connector line for desktop */}
              <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[#1cb15c] to-[#1cb15c]/30" />
            </motion.div>

            {/* Step 2 */}
            <motion.div variants={itemVariants} className="relative flex flex-col items-center text-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-[#1cb15c]/20 flex items-center justify-center border-2 border-[#1cb15c]">
                  <Sparkles className="w-10 h-10 text-[#1cb15c]" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#1cb15c] flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
              </div>
              <h3 className="text-white text-xl font-bold">Complete seu Perfil</h3>
              <p className="text-white/60 text-sm max-w-[280px]">
                Adicione sua foto, posição, times, conquistas e destaques. Quanto mais completo, mais visibilidade você terá.
              </p>
              {/* Connector line for desktop */}
              <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[#1cb15c] to-[#1cb15c]/30" />
            </motion.div>

            {/* Step 3 */}
            <motion.div variants={itemVariants} className="relative flex flex-col items-center text-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-[#1cb15c]/20 flex items-center justify-center border-2 border-[#1cb15c]">
                  <Rocket className="w-10 h-10 text-[#1cb15c]" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#1cb15c] flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
              </div>
              <h3 className="text-white text-xl font-bold">Conecte-se e Conquiste</h3>
              <p className="text-white/60 text-sm max-w-[280px]">
                Siga atletas, publique conteúdo, converse com olheiros e mostre seu talento para o mundo do futebol.
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="flex flex-col gap-4 mb-12"
          >
            <p className="text-[#1cb15c] text-sm font-medium uppercase tracking-wider">
              Recursos Principais
            </p>
            <h2 className="text-white text-3xl md:text-4xl font-black max-w-[720px]">
              Tudo que você precisa para evoluir
            </h2>
            <p className="text-white/60 text-base max-w-[720px]">
              Ferramentas profissionais desenhadas especificamente para o ecossistema do futebol amador e semiprofissional.
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.02, borderColor: "rgba(28, 177, 92, 0.5)" }}
                className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#1a3d26] p-6 transition-colors cursor-default"
              >
                <div className="w-12 h-12 rounded-full bg-[#1cb15c]/20 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-[#1cb15c]" />
                </div>
                <h3 className="text-white text-lg font-bold">{feature.title}</h3>
                <p className="text-white/60 text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* CTA Section */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="py-16 px-4"
        >
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-white text-2xl md:text-3xl font-black mb-4">
              Pronto para entrar em campo?
            </h2>
            <p className="text-white/60 mb-8">
              Junte-se a milhares de jogadores e comece sua jornada profissional hoje.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => navigate("/auth")}
                className="bg-[#1cb15c] hover:bg-[#1cb15c]/90 text-white font-medium px-8 h-12 rounded-full"
              >
                Baixar App
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8 px-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={logoText} alt="Soccer Vitae" className="h-6" />
            </div>
            <div className="flex gap-6 text-white/60 text-sm">
              <a href="#" className="hover:text-white transition-colors">Termos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Suporte</a>
            </div>
            <p className="text-white/40 text-xs">
              © {new Date().getFullYear()} Soccer Vitae. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Landing;
