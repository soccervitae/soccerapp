import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const GuestBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-primary via-primary/95 to-primary/90 backdrop-blur-lg border-t border-primary-foreground/10 shadow-2xl"
    >
      <div className="container max-w-4xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="hidden sm:flex h-12 w-12 rounded-full bg-primary-foreground/20 items-center justify-center">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-primary-foreground font-semibold text-base sm:text-lg flex items-center gap-2 justify-center sm:justify-start">
                Junte-se à comunidade
                <Sparkles className="h-4 w-4" />
              </h3>
              <p className="text-primary-foreground/80 text-sm">
                Siga atletas, compartilhe conquistas e muito mais
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
              className="flex-1 sm:flex-none border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              Entrar
            </Button>
            <Button
              onClick={() => navigate("/signup")}
              className="flex-1 sm:flex-none bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              Criar conta grátis
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GuestBanner;
