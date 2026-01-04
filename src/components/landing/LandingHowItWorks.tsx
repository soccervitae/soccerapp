import { motion } from "framer-motion";
import { UserPlus, FileEdit, Network, Rocket } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Crie sua Conta",
    description: "Cadastre-se gratuitamente em menos de 1 minuto"
  },
  {
    icon: FileEdit,
    step: "02",
    title: "Complete seu Perfil",
    description: "Adicione suas informações, conquistas e histórico"
  },
  {
    icon: Network,
    step: "03",
    title: "Conecte-se",
    description: "Encontre e siga atletas, técnicos e profissionais"
  },
  {
    icon: Rocket,
    step: "04",
    title: "Cresça",
    description: "Compartilhe, interaja e impulsione sua carreira"
  }
];

export const LandingHowItWorks = () => {
  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Como <span className="text-primary">funciona</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Comece a usar o Soccer Vitae em poucos passos
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                viewport={{ once: true }}
                className="relative text-center"
              >
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 relative z-10 border-4 border-background">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
