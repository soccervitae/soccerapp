import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRequirePwa } from "@/hooks/useRequirePwa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Eye, EyeOff, Mail, Lock, User, Loader2, Check, X, ArrowRight, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { registerDevice, isDeviceTrusted, trustCurrentDevice } from "@/services/deviceService";
import { Checkbox } from "@/components/ui/checkbox";
import SignupVerification from "@/components/auth/SignupVerification";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Social Login Buttons Component
const SocialLoginButtons = ({ onError }: { onError?: (message: string) => void }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Erro no login com Google:", error);
      onError?.(error.message || "Não foi possível fazer login com Google");
      setLoading(false);
    }
  };

  return (
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
        <Button 
          variant="outline" 
          className="h-12" 
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
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
          )}
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
  );
};

const Auth = () => {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [socialError, setSocialError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shouldBlockAccess, isLoading: pwaLoading } = useRequirePwa();

  // Redirect mobile browser users to install page
  useEffect(() => {
    if (!pwaLoading && shouldBlockAccess) {
      navigate("/install", { replace: true });
    }
  }, [shouldBlockAccess, pwaLoading, navigate]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // Show loader while checking PWA status
  if (pwaLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center py-8">
        {/* Logo */}
        <img 
          src="https://wdgpmpgdlauiawbtbxmn.supabase.co/storage/v1/object/public/site-assets/soccervitaeoff.png" 
          alt="Soccer Vitae"
          className="h-10 w-auto object-contain"
        />
      </div>

      {/* Auth Card */}
      <div className="flex-1 bg-white px-6 pt-2 pb-8">
        <div className="max-w-sm mx-auto">
          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v as "login" | "signup");
            setSocialError(null);
          }}>
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

          {/* Social Login - only show on login tab */}
          {activeTab === "login" && (
            <>
              <SocialLoginButtons onError={setSocialError} />
              {socialError && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <X className="h-4 w-4 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive">{socialError}</p>
                </div>
              )}
            </>
          )}

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
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Countdown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendConfirmation = async () => {
    if (!email || resendCooldown > 0) return;
    
    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (!error) {
        setResendCooldown(60);
      }
    } catch (error: any) {
      // Error handled silently
    } finally {
      setResendingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEmailNotConfirmed(false);

    const { error } = await signIn(email, password);

    if (error) {
      // Check if it's an email not confirmed error
      if (error.message.includes("Email not confirmed")) {
        setEmailNotConfirmed(true);
        setLoading(false);
        return;
      }

      setErrorMessage(
        error.message === "Invalid login credentials" 
          ? "Email ou senha incorretos. Verifique seus dados e tente novamente." 
          : error.message
      );
      setLoading(false);
      return;
    }

    // Get user after successful login
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Register device automatically (pass email for new device notification)
      await registerDevice(user.id, email);

      // If "remember device" is checked, trust the device for 30 days
      if (rememberDevice) {
        await trustCurrentDevice(user.id);
      }

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
          setErrorMessage("Não foi possível enviar o código de verificação.");
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

    navigate("/");

    setLoading(false);
  };

  // Email not confirmed state - show friendly UI
  if (emailNotConfirmed) {
    return (
      <div className="text-center py-6 space-y-6">
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="h-10 w-10 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            Confirme seu email
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Enviamos um link de confirmação para <strong className="text-foreground">{email}</strong>. 
            Por favor, verifique sua caixa de entrada e spam.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleResendConfirmation}
            variant="outline"
            className="w-full h-12"
            disabled={resendingEmail || resendCooldown > 0}
          >
            {resendingEmail ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reenviando...
              </>
            ) : resendCooldown > 0 ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Aguarde {resendCooldown}s
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reenviar email de confirmação
              </>
            )}
          </Button>
          
          <Button
            onClick={() => setEmailNotConfirmed(false)}
            variant="ghost"
            className="w-full"
          >
            Tentar novamente com outro email
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Não recebeu o email? Verifique a pasta de spam ou lixo eletrônico.
        </p>
      </div>
    );
  }

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
            onChange={(e) => {
              setEmail(e.target.value);
              setErrorMessage(null);
            }}
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
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorMessage(null);
            }}
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="remember-device" 
              checked={rememberDevice}
              onCheckedChange={(checked) => setRememberDevice(checked === true)}
            />
            <label 
              htmlFor="remember-device" 
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              Lembrar deste dispositivo
            </label>
          </div>
          <Link
            to="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Esqueceu a senha?
          </Link>
        </div>
      </div>

      {/* Mensagem de erro */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <X className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{errorMessage}</p>
        </div>
      )}

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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "invalid" | "valid">("idle");
  const [showVerification, setShowVerification] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Estados "touched" para feedback visual após interação
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  
  const { signUp } = useAuth();
  
  // Validações individuais
  const isFirstNameValid = firstName.trim().length >= 2;
  const isLastNameValid = lastName.trim().length >= 2;
  const isEmailValid = emailStatus === "valid";
  const doPasswordsMatch = password === confirmPassword;


  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getPasswordStrength = (pwd: string): { 
    score: number; 
    label: string; 
    color: string;
    requirements: { hasMinLength: boolean; hasUppercase: boolean; hasNumber: boolean; hasSpecial: boolean };
  } => {
    const requirements = {
      hasMinLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[^a-zA-Z0-9]/.test(pwd),
    };

    if (pwd.length === 0) return { score: 0, label: "", color: "", requirements };
    
    let score = 0;
    
    // Length checks
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    
    // Character variety checks
    if (/[a-z]/.test(pwd)) score += 1;
    if (requirements.hasUppercase) score += 1;
    if (requirements.hasNumber) score += 1;
    if (requirements.hasSpecial) score += 1;
    
    if (score <= 2) return { score: 1, label: "Fraca", color: "bg-destructive", requirements };
    if (score <= 4) return { score: 2, label: "Média", color: "bg-yellow-500", requirements };
    if (score <= 5) return { score: 3, label: "Boa", color: "bg-emerald-400", requirements };
    return { score: 4, label: "Forte", color: "bg-emerald-600", requirements };
  };

  const passwordStrength = getPasswordStrength(password);
  
  const isPasswordValid = 
    password.length >= 8 &&
    passwordStrength.requirements.hasUppercase &&
    passwordStrength.requirements.hasNumber &&
    passwordStrength.requirements.hasSpecial;

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
    setErrorMessage(null);

    if (firstName.trim().length < 2) {
      setErrorMessage("O nome deve ter pelo menos 2 caracteres");
      return;
    }

    if (lastName.trim().length < 2) {
      setErrorMessage("O sobrenome deve ter pelo menos 2 caracteres");
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage("Por favor, insira um email válido");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem");
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage("A senha deve ter no mínimo 8 caracteres, incluindo letra maiúscula, número e caractere especial");
      return;
    }

    setLoading(true);

    const { error } = await signUp({
      email,
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });

    if (error) {
      setErrorMessage(translateError(error.message));
      setLoading(false);
      return;
    }

    // Get the newly created user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setErrorMessage("Erro ao criar conta. Tente novamente.");
      setLoading(false);
      return;
    }

    // Send verification code
    const { error: sendError } = await supabase.functions.invoke("send-signup-verification", {
      body: {
        email: email,
        user_id: user.id,
        first_name: firstName.trim(),
      },
    });

    if (sendError) {
      console.error("Error sending verification code:", sendError);
      toast.error("Erro ao enviar código de verificação");
      setLoading(false);
      return;
    }

    // Show verification screen
    setUserId(user.id);
    setShowVerification(true);
    setLoading(false);
  };

  const handleVerificationComplete = async () => {
    // Sign out user from browser - they need to login again in PWA
    await supabase.auth.signOut();
    // Redirect to install page with signup flag
    window.location.href = "/install?from=signup";
  };

  const handleBackToSignup = () => {
    setShowVerification(false);
    setUserId(null);
  };

  // Show verification screen
  if (showVerification && userId) {
    return (
      <SignupVerification
        email={email}
        userId={userId}
        firstName={firstName}
        onVerified={handleVerificationComplete}
        onBack={handleBackToSignup}
      />
    );
  }


  const isFormValid = 
    firstName.trim().length >= 2 && 
    lastName.trim().length >= 2 &&
    emailStatus === "valid" &&
    isPasswordValid &&
    password === confirmPassword;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mensagem de erro */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <X className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{errorMessage}</p>
        </div>
      )}

      {/* Nome e Sobrenome em linha */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="signup-firstname" className="text-xs font-semibold uppercase text-muted-foreground">
            Nome <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="signup-firstname"
              type="text"
              placeholder="João"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setErrorMessage(null);
              }}
              onBlur={() => setTouched(prev => ({ ...prev, firstName: true }))}
              className={`pl-10 pr-10 h-12 bg-muted/50 transition-colors ${
                touched.firstName 
                  ? isFirstNameValid 
                    ? "border-emerald-500 border" 
                    : "border-destructive border"
                  : "border-0"
              }`}
              maxLength={30}
              required
            />
            {touched.firstName && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isFirstNameValid ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <X className="h-4 w-4 text-destructive" />
                )}
              </div>
            )}
          </div>
          {touched.firstName && !isFirstNameValid && (
            <p className="text-xs text-destructive">Mínimo 2 caracteres</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-lastname" className="text-xs font-semibold uppercase text-muted-foreground">
            Sobrenome <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="signup-lastname"
              type="text"
              placeholder="Silva"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setErrorMessage(null);
              }}
              onBlur={() => setTouched(prev => ({ ...prev, lastName: true }))}
              className={`pr-10 h-12 bg-muted/50 transition-colors ${
                touched.lastName 
                  ? isLastNameValid 
                    ? "border-emerald-500 border" 
                    : "border-destructive border"
                  : "border-0"
              }`}
              maxLength={50}
              required
            />
            {touched.lastName && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isLastNameValid ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <X className="h-4 w-4 text-destructive" />
                )}
              </div>
            )}
          </div>
          {touched.lastName && !isLastNameValid && (
            <p className="text-xs text-destructive">Mínimo 2 caracteres</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-xs font-semibold uppercase text-muted-foreground">
          Email <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="signup-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => {
              handleEmailChange(e.target.value);
              setErrorMessage(null);
            }}
            onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
            className={`pl-10 pr-10 h-12 bg-muted/50 transition-colors ${
              touched.email && email.length > 0
                ? isEmailValid 
                  ? "border-emerald-500 border" 
                  : "border-destructive border"
                : "border-0"
            }`}
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

      {/* Senha */}
      <div className="space-y-2">
        <Label htmlFor="signup-password" className="text-xs font-semibold uppercase text-muted-foreground">
          Senha <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorMessage(null);
            }}
            onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
            className={`pl-10 pr-10 h-12 bg-muted/50 transition-colors ${
              touched.password && password.length > 0
                ? isPasswordValid 
                  ? "border-emerald-500 border" 
                  : "border-destructive border"
                : "border-0"
            }`}
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
        {/* Password Strength Indicator */}
        {password.length > 0 && (
          <div className="space-y-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    passwordStrength.score >= level
                      ? passwordStrength.color
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className={`text-xs ${
              passwordStrength.score <= 1 ? "text-destructive" : 
              passwordStrength.score === 2 ? "text-yellow-600" : 
              "text-emerald-600"
            }`}>
              Força: {passwordStrength.label}
            </p>
            {/* Requirements checklist */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
              <div className={`flex items-center gap-1 ${passwordStrength.requirements.hasMinLength ? "text-emerald-600" : "text-muted-foreground"}`}>
                {passwordStrength.requirements.hasMinLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span>8+ caracteres</span>
              </div>
              <div className={`flex items-center gap-1 ${passwordStrength.requirements.hasUppercase ? "text-emerald-600" : "text-muted-foreground"}`}>
                {passwordStrength.requirements.hasUppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span>Letra maiúscula</span>
              </div>
              <div className={`flex items-center gap-1 ${passwordStrength.requirements.hasNumber ? "text-emerald-600" : "text-muted-foreground"}`}>
                {passwordStrength.requirements.hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span>Número</span>
              </div>
              <div className={`flex items-center gap-1 ${passwordStrength.requirements.hasSpecial ? "text-emerald-600" : "text-muted-foreground"}`}>
                {passwordStrength.requirements.hasSpecial ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span>Caractere especial</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmar Senha */}
      <div className="space-y-2">
        <Label htmlFor="signup-confirm" className="text-xs font-semibold uppercase text-muted-foreground">
          Confirmar Senha <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="signup-confirm"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setErrorMessage(null);
            }}
            onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
            className={`pl-10 pr-10 h-12 bg-muted/50 transition-colors ${
              touched.confirmPassword && confirmPassword.length > 0
                ? doPasswordsMatch && isPasswordValid
                  ? "border-emerald-500 border" 
                  : "border-destructive border"
                : "border-0"
            }`}
            required
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {confirmPassword.length > 0 && doPasswordsMatch && (
              <Check className="h-4 w-4 text-emerald-500" />
            )}
            {confirmPassword.length > 0 && !doPasswordsMatch && (
              <X className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>
        {touched.confirmPassword && confirmPassword.length > 0 && !doPasswordsMatch && (
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
