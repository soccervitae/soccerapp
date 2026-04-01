import { useState, useImperativeHandle, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Mail, Lock, Loader2, User, Check, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { registerDevice, isDeviceTrusted, trustCurrentDevice } from "@/services/deviceService";
import SignupVerification from "@/components/auth/SignupVerification";

export interface DesktopLoginCardRef {
  switchToSignup: () => void;
}

const DesktopLoginCard = forwardRef<DesktopLoginCardRef>((_, ref) => {
  const [mode, setMode] = useState<"login" | "signup">("login");

  useImperativeHandle(ref, () => ({
    switchToSignup: () => setMode("signup"),
  }));

  return (
    <div className="hidden md:flex flex-col w-[380px] shrink-0 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-8 self-center max-h-[90vh] overflow-y-auto">
      {mode === "login" ? (
        <LoginForm onSwitchToSignup={() => setMode("signup")} />
      ) : (
        <SignupForm onSwitchToLogin={() => setMode("login")} />
      )}
    </div>
  );
});

// ── Login Form ──────────────────────────────────────────
interface LoginFormProps {
  onSwitchToSignup: () => void;
}

const LoginForm = ({ onSwitchToSignup }: LoginFormProps) => {
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
    <>
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
            className="text-xs transition-colors text-emerald-500"
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
          onClick={onSwitchToSignup}
          className="font-medium transition-colors text-emerald-500"
        >
          Cadastre-se
        </button>
      </p>
    </>
  );
};

// ── Signup Form ─────────────────────────────────────────
interface SignupFormProps {
  onSwitchToLogin: () => void;
}

const SignupForm = ({ onSwitchToLogin }: SignupFormProps) => {
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const isPasswordValid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^a-zA-Z0-9]/.test(password);

  const isFormValid =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    validateEmail(email) &&
    isPasswordValid &&
    password === confirmPassword &&
    gender.length > 0;

  const translateError = (msg: string): string => {
    if (msg.includes("User already registered")) return "Este email já está cadastrado. Tente fazer login.";
    if (msg.includes("Password should be at least")) return "A senha deve ter pelo menos 6 caracteres.";
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isFormValid) {
      setErrorMessage("Preencha todos os campos corretamente");
      return;
    }

    setLoading(true);

    const { error } = await signUp({
      email,
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      accountType: accountType || undefined,
    });

    if (error) {
      setErrorMessage(translateError(error.message));
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setErrorMessage("Erro ao criar conta. Tente novamente.");
      setLoading(false);
      return;
    }

    await supabase
      .from("profiles")
      .update({ account_type: accountType, gender: gender || null } as any)
      .eq("id", user.id);

    const { error: sendError } = await supabase.functions.invoke("send-signup-verification", {
      body: { email, user_id: user.id, first_name: firstName.trim() },
    });

    if (sendError) {
      toast.error("Erro ao enviar código de verificação");
      setLoading(false);
      return;
    }

    setUserId(user.id);
    setShowVerification(true);
    setLoading(false);
  };

  const handleVerificationComplete = async () => {
    await supabase.auth.signOut();
    window.location.href = "/install?from=signup";
  };

  if (showVerification && userId) {
    return (
      <SignupVerification
        email={email}
        userId={userId}
        firstName={firstName}
        onVerified={handleVerificationComplete}
        onBack={() => { setShowVerification(false); setUserId(null); }}
      />
    );
  }

  const inputClass = "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary h-10";
  const labelClass = "text-white/70 text-xs";

  return (
    <>
      {/* Back to login */}
      <button
        onClick={onSwitchToLogin}
        className="flex items-center gap-1 text-xs text-white/50 hover:text-white/70 mb-4 transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        Voltar ao login
      </button>

      <h3 className="text-white font-semibold text-lg mb-4">Criar conta</h3>

      {errorMessage && (
        <div className="flex items-center gap-2 p-2 bg-red-500/20 border border-red-500/30 rounded-lg mb-3">
          <X className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-300">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Account Type */}
        <div className="space-y-1">
          <Label className={labelClass}>Tipo de Conta *</Label>
          <Select value={accountType} onValueChange={setAccountType}>
            <SelectTrigger className={`${inputClass} w-full`}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="atleta">Atleta</SelectItem>
              <SelectItem value="comissao_tecnica">Comissão Técnica</SelectItem>
              <SelectItem value="time">Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Name row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className={labelClass}>Nome *</Label>
            <Input
              placeholder="João"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
              maxLength={30}
            />
          </div>
          <div className="space-y-1">
            <Label className={labelClass}>Sobrenome *</Label>
            <Input
              placeholder="Silva"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
              maxLength={50}
            />
          </div>
        </div>

        {/* Gender (hidden for teams) */}
        {accountType !== "time" && (
          <div className="space-y-1">
            <Label className={labelClass}>Sexo *</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className={`${inputClass} w-full`}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="homem">Masculino</SelectItem>
                <SelectItem value="mulher">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Email */}
        <div className="space-y-1">
          <Label className={labelClass}>E-mail *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`pl-10 ${inputClass}`}
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <Label className={labelClass}>Senha *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`pl-10 pr-10 ${inputClass}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password.length > 0 && !isPasswordValid && (
            <p className="text-[10px] text-white/40">Mín. 8 caracteres, maiúscula, número e especial</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <Label className={labelClass}>Confirmar Senha *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`pl-10 ${inputClass}`}
            />
            {confirmPassword.length > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {password === confirmPassword ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <X className="w-4 h-4 text-red-400" />
                )}
              </div>
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading || !isFormValid}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 rounded-lg"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cadastrar"}
        </Button>
      </form>

      <p className="text-center text-xs text-white/40 mt-4">
        Já tem conta?{" "}
        <button
          onClick={onSwitchToLogin}
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Entrar
        </button>
      </p>
    </>
  );
};

export default DesktopLoginCard;
