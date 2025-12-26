import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, Users, Trophy, MessageCircle, Bell } from "lucide-react";

interface OnboardingSlide {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    icon: <Users className="w-16 h-16" />,
    title: "Conecte-se com atletas",
    description: "Encontre e siga atletas de todo o mundo. Acompanhe suas carreiras e crie sua rede profissional.",
    color: "from-primary/20 to-primary/5",
  },
  {
    icon: <Trophy className="w-16 h-16" />,
    title: "Mostre suas conquistas",
    description: "Adicione campeonatos, títulos e prêmios ao seu perfil. Construa seu currículo esportivo.",
    color: "from-amber-500/20 to-amber-500/5",
  },
  {
    icon: <MessageCircle className="w-16 h-16" />,
    title: "Compartilhe momentos",
    description: "Publique fotos, vídeos e atualizações. Interaja com a comunidade através de curtidas e comentários.",
    color: "from-blue-500/20 to-blue-500/5",
  },
  {
    icon: <Bell className="w-16 h-16" />,
    title: "Fique por dentro",
    description: "Receba notificações de novos seguidores, curtidas e mensagens. Nunca perca uma oportunidade.",
    color: "from-purple-500/20 to-purple-500/5",
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Skip button */}
      <div className="absolute top-4 right-4 z-10">
        <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
          Pular
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center max-w-md"
          >
            {/* Icon */}
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${slide.color} flex items-center justify-center mb-8 text-primary`}>
              {slide.icon}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold mb-4">{slide.title}</h1>

            {/* Description */}
            <p className="text-muted-foreground text-lg leading-relaxed">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 space-y-6">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-primary w-6"
                  : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Button */}
        <Button onClick={handleNext} className="w-full h-12 text-base font-medium">
          {isLastSlide ? (
            "Começar"
          ) : (
            <>
              Próximo
              <ChevronRight className="w-5 h-5 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
