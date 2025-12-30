import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { 
  ChevronRight, 
  User, 
  Newspaper, 
  MessageCircle, 
  Compass, 
  Trophy,
  Sparkles,
  Check
} from "lucide-react";
import { toast } from "sonner";

interface TutorialSlide {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const tutorialSlides: TutorialSlide[] = [
  {
    icon: <User className="w-12 h-12" />,
    title: "Seu Perfil Profissional",
    description: "Adicione conquistas, campeonatos e destaques para construir seu currículo esportivo completo.",
    color: "from-primary/20 to-primary/5",
  },
  {
    icon: <Newspaper className="w-12 h-12" />,
    title: "Feed & Stories",
    description: "Compartilhe fotos, vídeos e momentos especiais da sua carreira com a comunidade.",
    color: "from-blue-500/20 to-blue-500/5",
  },
  {
    icon: <MessageCircle className="w-12 h-12" />,
    title: "Mensagens Diretas",
    description: "Conecte-se com outros atletas, técnicos e profissionais do esporte.",
    color: "from-green-500/20 to-green-500/5",
  },
  {
    icon: <Compass className="w-12 h-12" />,
    title: "Explore & Descubra",
    description: "Encontre novos atletas, times e oportunidades em todo o mundo.",
    color: "from-purple-500/20 to-purple-500/5",
  },
];

export default function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [confettiVisible, setConfettiVisible] = useState(true);

  useEffect(() => {
    // Hide confetti after animation
    const timer = setTimeout(() => setConfettiVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleStartTutorial = () => {
    setShowWelcome(false);
  };

  const handleNext = () => {
    if (currentSlide < tutorialSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await updateProfile.mutateAsync({ onboarding_completed: true });
      navigate(`/profile/${user?.id}`, { replace: true });
    } catch (error) {
      toast.error("Erro ao concluir onboarding");
      navigate(`/profile/${user?.id}`, { replace: true });
    }
  };

  const firstName = profile?.full_name?.split(" ")[0] || profile?.username || "Atleta";
  const slide = tutorialSlides[currentSlide];
  const isLastSlide = currentSlide === tutorialSlides.length - 1;

  // Welcome Screen
  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Confetti Animation */}
        {confettiVisible && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: [
                    "hsl(var(--primary))",
                    "#FFD700",
                    "#00CED1",
                    "#FF69B4",
                    "#32CD32",
                  ][Math.floor(Math.random() * 5)],
                }}
                initial={{ y: -20, opacity: 1, scale: 0 }}
                animate={{
                  y: "100vh",
                  opacity: [1, 1, 0],
                  scale: [0, 1, 1],
                  rotate: Math.random() * 360,
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        )}

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center max-w-md"
        >
          {/* Trophy Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-6 shadow-lg"
          >
            <Trophy className="w-12 h-12 text-white" />
          </motion.div>

          {/* Welcome Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground font-medium">Parabéns!</span>
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-3">
              Bem-vindo, {firstName}!
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Seu perfil está completo e você faz parte da comunidade Soccer Vitae.
            </p>
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full space-y-3"
          >
            <Button 
              onClick={handleStartTutorial} 
              className="w-full h-12 text-base font-medium"
            >
              Ver tutorial do app
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleComplete}
              className="w-full text-muted-foreground"
            >
              Ir para o Perfil
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Tutorial Slides
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
            <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${slide.color} flex items-center justify-center mb-8 text-primary`}>
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
          {tutorialSlides.map((_, index) => (
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
            "Começar a usar"
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
}
