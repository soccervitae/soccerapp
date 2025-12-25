import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, Loader2, Check, X, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { registerDevice, isDeviceTrusted } from "@/services/deviceService";

const Auth = () => {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with stadium background effect */}
      <div className="relative h-64 bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 flex flex-col items-center justify-center overflow-hidden">
        {/* Stadium lights effect */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-1/4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </div>
        
        {/* Logo */}
        <div className="relative z-10 w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
          <span className="text-4xl">⚽</span>
        </div>
        
        {/* Title */}
        <h1 className="relative z-10 text-2xl font-bold text-white mb-2">
          Conecte-se ao Jogo
        </h1>
        <p className="relative z-10 text-sm text-zinc-400 text-center px-8 max-w-sm">
          A rede social definitiva para atletas que querem chegar ao próximo nível.
        </p>
      </div>

      {/* Auth Card */}
      <div className="flex-1 -mt-6 bg-background rounded-t-3xl px-6 pt-6 pb-8">
        <div className="max-w-sm mx-auto">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl h-12">
              <TabsTrigger 
                value="login" 
                className="rounded-lg font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                ENTRAR
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="rounded-lg font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                CADASTRAR
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <LoginForm />
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <SignupForm onSuccess={() => setActiveTab("login")} />
            </TabsContent>
          </Tabs>

          {/* Social Login */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou continue com
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-12" disabled>
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
              <Button variant="outline" className="h-12" disabled>
                <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                </svg>
                Apple
              </Button>
            </div>
          </div>

          {/* Toggle text */}
          <div className="mt-8 text-center">
            {activeTab === "login" ? (
              <p className="text-muted-foreground">
                Não tem uma conta?{" "}
                <button
                  onClick={() => setActiveTab("signup")}
                  className="text-primary font-semibold hover:underline"
                >
                  Cadastre-se grátis
                </button>
              </p>
            ) : (
              <p className="text-muted-foreground">
                Já tem uma conta?{" "}
                <button
                  onClick={() => setActiveTab("login")}
                  className="text-primary font-semibold hover:underline"
                >
                  Entrar
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Login Form Component
const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: error.message === "Invalid login credentials" 
          ? "Email ou senha incorretos" 
          : error.message,
      });
      setLoading(false);
      return;
    }

    // Get user after successful login
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Register device automatically (pass email for new device notification)
      await registerDevice(user.id, email);

      // Check if user has 2FA enabled
      const { data: profile } = await supabase
        .from("profiles")
        .select("two_factor_enabled")
        .eq("id", user.id)
        .single();

      if (profile?.two_factor_enabled) {
        // Check if current device is trusted
        const trusted = await isDeviceTrusted(user.id);
        
        if (trusted) {
          // Device is trusted, skip 2FA
          toast({
            title: "Bem-vindo de volta!",
            description: "Login realizado com sucesso.",
          });
          navigate("/");
          setLoading(false);
          return;
        }

        // Device not trusted, send 2FA code
        const { data, error: sendError } = await supabase.functions.invoke("send-2fa-code", {
          body: {
            email: email,
            user_id: user.id,
          },
        });

        if (sendError) {
          console.error("Error sending 2FA code:", sendError);
          toast({
            variant: "destructive",
            title: "Erro ao enviar código",
            description: "Não foi possível enviar o código de verificação.",
          });
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        // Redirect to 2FA verification page
        navigate("/two-factor-verify", {
          state: {
            email: email,
            userId: user.id,
            maskedEmail: data?.masked_email || email,
          },
          replace: true,
        });
        setLoading(false);
        return;
      }
    }

    toast({
      title: "Bem-vindo de volta!",
      description: "Login realizado com sucesso.",
    });
    navigate("/");

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="login-email" className="text-xs font-semibold uppercase text-muted-foreground">
          Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="login-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-12 bg-muted/50 border-0"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password" className="text-xs font-semibold uppercase text-muted-foreground">
          Senha
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10 h-12 bg-muted/50 border-0"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <div className="text-right">
          <Link
            to="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Esqueceu a senha?
          </Link>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Entrando...
          </>
        ) : (
          <>
            Entrar no Campo
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>
    </form>
  );
};

// Signup Form Component
interface SignupFormProps {
  onSuccess: () => void;
}

const SignupForm = ({ onSuccess }: SignupFormProps) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [emailStatus, setEmailStatus] = useState<"idle" | "invalid" | "valid">("idle");
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { signUp } = useAuth();
  const { toast } = useToast();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (usernameToCheck.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");

    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", usernameToCheck)
      .maybeSingle();

    if (error) {
      console.error("Error checking username:", error);
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus(data ? "taken" : "available");
  };

  const handleUsernameChange = (value: string) => {
    // Normalize: lowercase, only letters, numbers and underscore
    const normalized = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(normalized);
    setUsernameStatus("idle");

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (normalized.length >= 3) {
      debounceTimeoutRef.current = setTimeout(() => {
        checkUsernameAvailability(normalized);
      }, 500);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value.length === 0) {
      setEmailStatus("idle");
    } else if (validateEmail(value)) {
      setEmailStatus("valid");
    } else {
      setEmailStatus("invalid");
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const translateError = (errorMessage: string): string => {
    if (errorMessage.includes("User already registered")) {
      return "Este email já está cadastrado. Tente fazer login.";
    }
    if (errorMessage.includes("Invalid login credentials")) {
      return "Credenciais inválidas.";
    }
    if (errorMessage.includes("Email not confirmed")) {
      return "Por favor, confirme seu email antes de fazer login.";
    }
    if (errorMessage.includes("Password should be at least")) {
      return "A senha deve ter pelo menos 6 caracteres.";
    }
    return errorMessage;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (username.length < 3) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "O nome de usuário deve ter pelo menos 3 caracteres",
      });
      return;
    }

    if (usernameStatus === "taken") {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Este nome de usuário já está em uso",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, insira um email válido",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "As senhas não coincidem",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
      });
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, username);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: translateError(error.message),
      });
    } else {
      toast({
        title: "Conta criada!",
        description: "Verifique seu email para confirmar o cadastro.",
      });
      onSuccess();
    }

    setLoading(false);
  };

  const isFormValid = 
    username.length >= 3 && 
    usernameStatus !== "taken" && 
    usernameStatus !== "checking" &&
    emailStatus === "valid" &&
    password.length >= 6 &&
    password === confirmPassword;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-username" className="text-xs font-semibold uppercase text-muted-foreground">
          Nome de usuário
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="signup-username"
            type="text"
            placeholder="seu_username"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            className="pl-10 pr-10 h-12 bg-muted/50 border-0"
            maxLength={20}
            required
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {usernameStatus === "checking" && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {usernameStatus === "available" && (
              <Check className="h-4 w-4 text-green-500" />
            )}
            {usernameStatus === "taken" && (
              <X className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>
        {usernameStatus === "taken" && (
          <p className="text-xs text-destructive">Este nome de usuário já está em uso</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-xs font-semibold uppercase text-muted-foreground">
          Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="signup-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            className="pl-10 pr-10 h-12 bg-muted/50 border-0"
            required
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {emailStatus === "valid" && (
              <Check className="h-4 w-4 text-green-500" />
            )}
            {emailStatus === "invalid" && (
              <X className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>
        {emailStatus === "invalid" && (
          <p className="text-xs text-destructive">Por favor, insira um email válido</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password" className="text-xs font-semibold uppercase text-muted-foreground">
          Senha
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10 h-12 bg-muted/50 border-0"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {password.length > 0 && password.length < 6 && (
          <p className="text-xs text-destructive">A senha deve ter pelo menos 6 caracteres</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-confirm" className="text-xs font-semibold uppercase text-muted-foreground">
          Confirmar Senha
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="signup-confirm"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10 pr-10 h-12 bg-muted/50 border-0"
            required
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {confirmPassword.length > 0 && password === confirmPassword && (
              <Check className="h-4 w-4 text-green-500" />
            )}
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <X className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>
        {confirmPassword.length > 0 && password !== confirmPassword && (
          <p className="text-xs text-destructive">As senhas não coincidem</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold"
        disabled={loading || !isFormValid}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Criando conta...
          </>
        ) : (
          "Criar Conta"
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Ao criar uma conta, você concorda com nossos{" "}
        <button type="button" className="text-primary hover:underline">
          Termos de Uso
        </button>{" "}
        e{" "}
        <button type="button" className="text-primary hover:underline">
          Política de Privacidade
        </button>
      </p>
    </form>
  );
};

export default Auth;
