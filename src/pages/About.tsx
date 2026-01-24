import { ArrowLeft, Trophy, Target, Users, Shield, Rocket, Heart, MapPin, MessageCircle, Star, Award, Search, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import soccerVitaeLogo from "@/assets/soccer-vitae-logo.png";

const values = [
  {
    icon: Users,
    title: "Comunidade",
    description: "Construímos uma comunidade global de atletas, treinadores e entusiastas do futebol."
  },
  {
    icon: Shield,
    title: "Integridade",
    description: "Promovemos um ambiente seguro, respeitoso e livre de discriminação."
  },
  {
    icon: Trophy,
    title: "Excelência",
    description: "Celebramos o talento e a dedicação de cada atleta em sua jornada."
  },
  {
    icon: Rocket,
    title: "Inovação",
    description: "Desenvolvemos ferramentas únicas para potencializar carreiras no futebol."
  }
];

const features = [
  {
    icon: Star,
    title: "Perfil Profissional",
    description: "Crie um perfil completo com suas estatísticas, posição, histórico e muito mais."
  },
  {
    icon: Heart,
    title: "Feed & Replays",
    description: "Compartilhe momentos, lances e conquistas com toda a comunidade."
  },
  {
    icon: Award,
    title: "Destaques & Conquistas",
    description: "Exiba seus melhores momentos e títulos conquistados ao longo da carreira."
  },
  {
    icon: MessageCircle,
    title: "Mensagens Diretas",
    description: "Conecte-se diretamente com outros atletas, treinadores e olheiros."
  },
  {
    icon: MapPin,
    title: "Times & Campeonatos",
    description: "Registre todo seu histórico de clubes e competições disputadas."
  },
  {
    icon: Search,
    title: "Explorar Talentos",
    description: "Descubra novos atletas por posição, localização e categoria."
  }
];

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Sobre | Soccer Vitae</title>
        <meta name="description" content="Conheça a Soccer Vitae, a rede social exclusiva para atletas de futebol. Nossa missão, valores e o que oferecemos para impulsionar sua carreira." />
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Sobre a Soccer Vitae</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <img src={soccerVitaeLogo} alt="Soccer Vitae" className="w-16 h-16 object-contain" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">A Rede Social do Atleta</h2>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
              A primeira plataforma criada exclusivamente para conectar atletas de futebol ao mundo, 
              oferecendo ferramentas profissionais para construir e impulsionar carreiras.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Fundada em 2024 • Brasil
          </p>
        </section>

        {/* Mission Section */}
        <section className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 shrink-0">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Nossa Missão</h3>
              <p className="text-muted-foreground leading-relaxed">
                Conectar atletas de futebol ao mundo, oferecendo uma plataforma profissional para 
                mostrar talento, construir carreira e alcançar novas oportunidades. Acreditamos que 
                todo atleta merece visibilidade e as ferramentas certas para brilhar.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Nossos Valores</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="bg-card rounded-xl p-5 border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{value.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{value.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Features Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">O que oferecemos</h3>
          <div className="grid grid-cols-1 gap-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-card rounded-xl p-4 border border-border flex items-start gap-3"
                >
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 shrink-0">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Entre em Contato</h3>
              <p className="text-muted-foreground text-sm mb-3">
                Tem dúvidas, sugestões ou quer saber mais sobre a Soccer Vitae? 
                Entre em contato conosco.
              </p>
              <a 
                href="mailto:contato@soccervitae.com"
                className="text-primary hover:underline text-sm font-medium"
              >
                contato@soccervitae.com
              </a>
            </div>
          </div>
        </section>

        {/* Footer Note */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          © 2024 Soccer Vitae. Todos os direitos reservados.
        </p>
      </main>
    </div>
  );
};

export default About;
