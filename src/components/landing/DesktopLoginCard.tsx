import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { registerDevice, isDeviceTrusted, trustCurrentDevice } from "@/services/deviceService";
import logoGreen from "@/assets/SOCCERVITAE_LOGO_NOVO_verde.png";

const DesktopLoginCard = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      // Check 2FA
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("two_factor_enabled")
          .eq("id", user.id)
          .single();

        if (profile?.two_factor_enabled) {
          const trusted = await isDeviceTrusted(user.id);
          if (!trusted) {
            navigate("/two-factor-verify");
            return;
          }
        }

        if (rememberDevice) {
          await registerDevice(user.id);
          await trustCurrentDevice(user.id);
        }

        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Não foi possível fazer login com Google");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="hidden md:flex flex-col w-[380px] shrink-0 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-8 self-center">
      

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-white/70 text-xs">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-white/70 text-xs">Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberDevice}
              onCheckedChange={(v) => setRememberDevice(v as boolean)}
              className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <label htmlFor="remember" className="text-xs text-white/50 cursor-pointer">
              Lembrar dispositivo
            </label>
          </div>
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Esqueceu a senha?
          </button>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 rounded-lg"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-transparent px-2 text-white/40">ou</span>
        </div>
      </div>

      {/* Google */}
      <Button
        variant="outline"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="w-full h-11 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-lg"
      >
        {googleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        Continuar com Google
      </Button>

      {/* Signup link */}
      <p className="text-center text-xs text-white/40 mt-5">
        Não tem conta?{" "}
        <button
          onClick={() => navigate("/auth?tab=signup")}
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Cadastre-se
        </button>
      </p>
    </div>
  );
};

export default DesktopLoginCard;
