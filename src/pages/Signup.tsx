import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, Loader2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Signup = () => {
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
  const navigate = useNavigate();
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
      navigate("/login");
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with gradient */}
      <div className="relative h-48 bg-gradient-to-br from-primary via-primary-dark to-emerald-700 flex items-end justify-center pb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
        <h1 className="text-3xl font-bold text-primary-foreground relative z-10">
          ⚽ SportConnect
        </h1>
      </div>

      {/* Form card */}
      <div className="flex-1 -mt-8 bg-background rounded-t-3xl px-6 pt-8 pb-6">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">Criar Conta</h2>
            <p className="text-muted-foreground mt-2">
              Junte-se à maior rede de atletas do Brasil
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de usuário</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="seu_username"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className="pl-10 pr-10"
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
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Apenas letras, números e underline (_)
                </p>
                <span className={`text-xs ${username.length > 20 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {username.length}/20
                </span>
              </div>
              {usernameStatus === "taken" && (
                <p className="text-xs text-destructive">Este nome de usuário já está em uso</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="pl-10 pr-10"
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
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
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
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
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
              className="w-full h-12 text-base font-semibold shadow-primary-glow"
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
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Ao criar uma conta, você concorda com nossos{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Termos de Uso
            </Link>{" "}
            e{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
          </div>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Já tem uma conta?{" "}
              <Link
                to="/login"
                className="text-primary font-semibold hover:text-primary-dark transition-colors"
              >
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
