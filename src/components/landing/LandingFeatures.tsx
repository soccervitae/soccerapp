import { motion } from "framer-motion";
import { 
  User, 
  Newspaper, 
  MessageCircle, 
  Film, 
  Shield, 
  Users,
  Trophy,
  Target
} from "lucide-react";

const features = [
  {
    icon: User,
    title: "Perfil Profissional",
    description: "Crie seu currículo esportivo completo com conquistas, estatísticas e histórico de carreira.",
    color: "from-emerald-500 to-green-600"
  },
  {
    icon: Newspaper,
    title: "Feed e Stories",
    description: "Compartilhe fotos, vídeos e atualizações da sua carreira com sua rede de contatos.",
    color: "from-blue-500 to-indigo-600"
  },
  {
    icon: MessageCircle,
    title: "Mensagens Diretas",
    description: "Conecte-se diretamente com atletas, técnicos, olheiros e profissionais do futebol.",
    color: "from-purple-500 to-violet-600"
  },
  {
    icon: Film,
    title: "Destaques",
    description: "Mostre suas melhores jogadas e momentos em galerias personalizadas de highlights.",
    color: "from-orange-500 to-red-600"
  },
  {
    icon: Shield,
    title: "Times e Clubes",
    description: "Registre seu histórico de clubes e construa sua trajetória profissional.",
    color: "from-cyan-500 to-teal-600"
  },
  {
    icon: Users,
    title: "Comunidade",
    description: "Construa sua base de fãs e conecte-se com torcedores do mundo inteiro.",
    color: "from-pink-500 to-rose-600"
  },
  {
    icon: Trophy,
    title: "Conquistas",
    description: "Destaque seus títulos, prêmios e conquistas ao longo da carreira.",
    color: "from-yellow-500 to-amber-600"
  },
  {
    icon: Target,
    title: "Visibilidade",
    description: "Aumente sua exposição para clubes, olheiros e oportunidades profissionais.",
    color: "from-lime-500 to-green-600"
  }
];

export const LandingFeatures = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Tudo que você precisa em{" "}
            <span className="text-primary">um só lugar</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Ferramentas profissionais para atletas que levam a carreira a sério
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="h-full p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
