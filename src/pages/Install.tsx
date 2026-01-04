import { useEffect, useState, useMemo } from "react";
import { Download, Share, MoreVertical, Plus, Smartphone, Zap, Bell, Wifi, Rocket, CheckCircle, ChevronRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useRequirePwa } from "@/hooks/useRequirePwa";
import logoText from "@/assets/soccervitae-logo-text.png";
type DeviceType = "ios" | "android" | "unknown";
const useDeviceType = (): DeviceType => {
  return useMemo(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return "ios";
    }
    if (/android/.test(userAgent)) {
      return "android";
    }
    return "unknown";
  }, []);
};
const Install = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isInstallable, isInstalled, promptInstall } = usePwaInstall();
  const { isPWA } = useRequirePwa();
  const [activeStep, setActiveStep] = useState(0);
  const deviceType = useDeviceType();
  const fromSignup = searchParams.get("from") === "signup";

  // Show installed message when PWA is detected (no auto-redirect)

  // Show installed message when PWA is detected (no auto-redirect)

  // Animate through steps
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  const handleInstall = async () => {
    await promptInstall();
  };
  const benefits = [{
    icon: Zap,
    text: "Acesso instantâneo"
  }, {
    icon: Bell,
    text: "Notificações push"
  }, {
    icon: Wifi,
    text: "Funciona offline"
  }, {
    icon: Rocket,
    text: "Experiência nativa"
  }];
  const iosSteps = [{
    title: "Abra no Safari",
    desc: "Use o navegador Safari"
  }, {
    title: "Toque em Compartilhar",
    desc: "Ícone na barra inferior",
    icon: Share
  }, {
    title: "Adicionar à Tela",
    desc: "Role e selecione a opção",
    icon: Plus
  }, {
    title: "Confirme",
    desc: "Toque em 'Adicionar'"
  }];
  const androidSteps = [{
    title: "Abra no Chrome",
    desc: "Use o Google Chrome"
  }, {
    title: "Toque no menu",
    desc: "Três pontos (⋮)",
    icon: MoreVertical
  }, {
    title: "Instalar app",
    desc: "Ou 'Adicionar à tela'"
  }, {
    title: "Confirme",
    desc: "Toque em 'Instalar'"
  }];
  return <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex flex-col overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl" animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3]
      }} transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }} />
        <motion.div className="absolute top-1/3 -left-20 w-48 h-48 rounded-full bg-primary/10 blur-3xl" animate={{
        scale: [1.2, 1, 1.2],
        opacity: [0.2, 0.4, 0.2]
      }} transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut"
      }} />
      </div>

      <div className="flex-1 px-4 py-8 max-w-lg mx-auto space-y-6 relative z-10">
        {/* Already Installed Notice - Show when PWA is detected */}
        {isPWA && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center"
            >
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </motion.div>
            <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
              Você já está no app!
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              O SOCCER VITAE está instalado e você está acessando pela tela inicial.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
            >
              Ir para o início
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* Hero Section - Only show if not in PWA */}
        {!isPWA && (
          <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.6
      }} className="text-center space-y-4">
          {/* Animated Phone Icon */}
          <motion.div className="relative w-28 h-28 mx-auto" initial={{
          scale: 0
        }} animate={{
          scale: 1
        }} transition={{
          type: "spring",
          stiffness: 200,
          delay: 0.2
        }}>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/30" />
            <motion.div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary to-primary-dark" animate={{
            boxShadow: ["0 0 0 0 hsl(var(--primary) / 0.4)", "0 0 0 15px hsl(var(--primary) / 0)"]
          }} transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut"
          }} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <img src={logoText} alt="SOCCER VITAE" className="w-full h-auto brightness-0 invert" />
            </div>
          </motion.div>


          {/* Main Message */}
          <motion.div initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.5
        }}>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Baixe o App
            </h1>
            <p className="text-muted-foreground mt-2 text-base">
              O SOCCER VITAE funciona como um aplicativo instalado no seu celular. Siga as instruções abaixo para adicionar à sua tela inicial.
            </p>
          </motion.div>

          {/* Alert Box */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mt-4"
          >
            <p className="text-amber-600 dark:text-amber-400 text-sm font-medium text-center">
              ⚠️ O login só está disponível dentro do aplicativo instalado
            </p>
          </motion.div>
        </motion.div>
        )}

        {/* Interactive Checklist for Signup Flow */}
        {fromSignup && !isPWA && <motion.div initial={{
        opacity: 0,
        scale: 0.95
      }} animate={{
        opacity: 1,
        scale: 1
      }} transition={{
        delay: 0.3
      }} className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <motion.div initial={{
            scale: 0
          }} animate={{
            scale: 1
          }} transition={{
            type: "spring",
            stiffness: 200,
            delay: 0.5
          }} className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </motion.div>
              <div>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Conta criada com sucesso!
                </p>
                <p className="text-xs text-muted-foreground">
                  Siga os passos para começar
                </p>
              </div>
            </div>

            {/* Interactive Checklist */}
            <div className="space-y-3">
              {[{
            step: 1,
            label: "Instalar o app",
            desc: "Adicione à tela inicial"
          }, {
            step: 2,
            label: "Abrir o app",
            desc: "Pela tela inicial"
          }, {
            step: 3,
            label: "Fazer login",
            desc: "Use seu e-mail e senha"
          }].map((item, index) => <motion.div key={item.step} initial={{
            opacity: 0,
            x: -20
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            delay: 0.6 + index * 0.15
          }} className="flex items-center gap-3 bg-background/50 rounded-xl p-3 border border-border/50">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">{item.step}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                </motion.div>)}
            </div>

            <motion.p initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 1.1
        }} className="text-xs text-muted-foreground mt-4 text-center">
              Por segurança, sua sessão não é transferida para o app
            </motion.p>
          </motion.div>}

        {/* Benefits Carousel */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.6
      }} className="flex justify-center gap-3 flex-wrap">
          {benefits.map((benefit, index) => <motion.div key={index} initial={{
          opacity: 0,
          scale: 0.8
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          delay: 0.7 + index * 0.1
        }} className="flex items-center gap-2 bg-card border rounded-full px-3 py-1.5 text-sm">
              <benefit.icon className="w-4 h-4 text-primary" />
              <span className="text-foreground/80">{benefit.text}</span>
            </motion.div>)}
        </motion.div>

        {/* Direct Install Button - Only show for Android/Chrome, not iOS */}
        <AnimatePresence>
          {isInstallable && !isInstalled && deviceType !== "ios" && <motion.div initial={{
          opacity: 0,
          scale: 0.9
        }} animate={{
          opacity: 1,
          scale: 1
        }} exit={{
          opacity: 0,
          scale: 0.9
        }} className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-5 text-primary-foreground shadow-lg shadow-primary/20">
              <div className="flex items-center gap-4 mb-4">
                <motion.div animate={{
              rotate: [0, 10, -10, 0]
            }} transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: 2
            }} className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Download className="w-6 h-6" />
                </motion.div>
                <div>
                  <p className="font-semibold">Instalação rápida</p>
                  <p className="text-sm opacity-90">Um toque para instalar</p>
                </div>
              </div>
              <Button onClick={handleInstall} className="w-full bg-white text-primary hover:bg-white/90 font-semibold" size="lg">
                <Download className="w-4 h-4 mr-2" />
                Instalar Agora
              </Button>
            </motion.div>}
        </AnimatePresence>

        {isInstalled && <motion.div initial={{
        opacity: 0,
        scale: 0.9
      }} animate={{
        opacity: 1,
        scale: 1
      }} className="bg-primary/10 border-2 border-primary rounded-2xl p-5 text-center">
            <motion.div initial={{
          scale: 0
        }} animate={{
          scale: 1
        }} transition={{
          type: "spring",
          stiffness: 200
        }} className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-3xl">✓</span>
            </motion.div>
            <p className="font-semibold text-primary text-lg">App instalado!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Abra pela sua tela inicial para continuar
            </p>
          </motion.div>}

        {/* Instructions */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.8
      }} className="space-y-4">
          {/* iOS Section - Show for iOS or unknown devices */}
          {(deviceType === "ios" || deviceType === "unknown") && <motion.div initial={{
          opacity: 0,
          x: -20
        }} animate={{
          opacity: 1,
          x: 0
        }} className="bg-card border rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-xl">
                  🍎
                </div>
                <div>
                  <h3 className="font-semibold">iPhone / iPad</h3>
                  <p className="text-xs text-muted-foreground">Instruções para Safari</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {iosSteps.map((step, index) => <motion.div key={index} className={`relative p-3 rounded-xl text-center transition-all duration-300 ${activeStep === index ? "bg-primary/10 border-2 border-primary" : "bg-muted/50 border-2 border-transparent"}`} animate={activeStep === index ? {
              scale: [1, 1.02, 1]
            } : {}} transition={{
              duration: 0.3
            }}>
                    <div className={`w-6 h-6 mx-auto mb-2 rounded-full flex items-center justify-center text-xs font-bold ${activeStep === index ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                      {index + 1}
                    </div>
                    {step.icon && <step.icon className={`w-4 h-4 mx-auto mb-1 ${activeStep === index ? "text-primary" : "text-muted-foreground"}`} />}
                    <p className="text-[10px] font-medium leading-tight">{step.title}</p>
                  </motion.div>)}
              </div>
            </motion.div>}

          {/* Android Section - Show for Android or unknown devices */}
          {(deviceType === "android" || deviceType === "unknown") && <motion.div initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} className="bg-card border rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-xl">
                  🤖
                </div>
                <div>
                  <h3 className="font-semibold">Android</h3>
                  <p className="text-xs text-muted-foreground">Instruções para Chrome</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {androidSteps.map((step, index) => <motion.div key={index} className={`relative p-3 rounded-xl text-center transition-all duration-300 ${activeStep === index ? "bg-primary/10 border-2 border-primary" : "bg-muted/50 border-2 border-transparent"}`} animate={activeStep === index ? {
              scale: [1, 1.02, 1]
            } : {}} transition={{
              duration: 0.3
            }}>
                    <div className={`w-6 h-6 mx-auto mb-2 rounded-full flex items-center justify-center text-xs font-bold ${activeStep === index ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                      {index + 1}
                    </div>
                    {step.icon && <step.icon className={`w-4 h-4 mx-auto mb-1 ${activeStep === index ? "text-primary" : "text-muted-foreground"}`} />}
                    <p className="text-[10px] font-medium leading-tight">{step.title}</p>
                  </motion.div>)}
              </div>
            </motion.div>}
        </motion.div>

        {/* Footer Message */}
        <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 1
      }} className="text-center pb-4 space-y-2">
          <p className="text-sm font-medium text-foreground">
            📱 Abra o app pela sua tela inicial após instalar
          </p>
          <p className="text-xs text-muted-foreground">
            O aplicativo ficará salvo como um ícone no seu celular
          </p>
        </motion.div>
      </div>
    </div>;
};
export default Install;