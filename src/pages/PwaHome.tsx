import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SoccerShowcase from "@/components/common/SoccerShowcase";

const PwaHome = () => {
  const navigate = useNavigate();
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setSocialLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error(`Erro no login com ${provider}:`, error);
      toast.error(`Não foi possível fazer login com ${provider === "google" ? "Google" : "Apple"}`);
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Background player image */}
      <div className="absolute inset-0 z-0">
        <SoccerShowcase fullscreen />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen px-6 py-10">

        {/* Hero text */}
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight uppercase">
            <span className="text-white">Jogue.</span>
            <br />
            <span className="text-primary">Brilhe.</span>
            <br />
            <span className="text-white">Conquiste.</span>
          </h1>
        </div>


        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-sm mx-auto pb-4">
          <Button
            className="w-full h-14 text-lg font-bold tracking-wide rounded-lg flex items-center justify-center gap-2"
            onClick={() => navigate("/auth", { state: { tab: "signup" } })}
          >
            Criar Conta
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            className="w-full h-14 text-lg font-bold tracking-wide rounded-lg border-white/20 text-white hover:bg-white/10 bg-white/5"
            onClick={() => navigate("/auth", { state: { tab: "login" } })}
          >
            Entrar
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/40 text-xs uppercase tracking-widest">ou entre com</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          {/* Social buttons */}
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => handleSocialLogin("google")}
              disabled={!!socialLoading}
              className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              {socialLoading === "google" ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="w-6 h-6">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PwaHome;
