import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, ArrowLeft, ArrowRight, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Stage = "request" | "verify" | "success";

const ForgotPassword = () => {
  const navigate = useNavigate();
  
  const [stage, setStage] = useState<Stage>("request");
  const [email, setEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email) {
      setError("Por favor, insira seu email");
      return;
    }

    setLoading(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("send-password-reset", {
        body: { email },
      });

      if (invokeError) {
        console.error("Erro ao invocar função:", invokeError);
        setError("Erro ao conectar com o servidor. Tente novamente.");
        toast({
          title: "Erro",
          description: "Não foi possível enviar o código. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        console.error("Erro retornado pela função:", data.error);
        setError(data.error);
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setMaskedEmail(data.maskedEmail || email);
      setStage("verify");
      toast({
        title: "Código enviado!",
        description: `Verifique sua caixa de entrada em ${data.maskedEmail || email}`,
      });
    } catch (error: any) {
      console.error("Erro ao solicitar reset:", error);
      setError("Erro inesperado. Por favor, tente novamente.");
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("Digite o código de 6 dígitos");
      return;
    }

    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("verify-password-reset", {
        body: { email, code, newPassword },
      });

      if (invokeError) {
        console.error("Erro ao verificar código:", invokeError);
        setError("Erro ao conectar com o servidor. Tente novamente.");
        toast({
          title: "Erro",
          description: "Não foi possível verificar o código. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        console.error("Erro retornado:", data.error);
        setError(data.error);
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setStage("success");
      toast({
        title: "Senha alterada!",
        description: "Sua senha foi redefinida com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error);
      setError("Erro inesperado. Por favor, tente novamente.");
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setLoading(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("send-password-reset", {
        body: { email },
      });

      if (invokeError || data?.error) {
        const errorMsg = data?.error || "Erro ao reenviar código";
        setError(errorMsg);
        toast({
          title: "Erro",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Código reenviado!",
        description: `Verifique sua caixa de entrada em ${maskedEmail}`,
      });
    } catch (error: any) {
      console.error("Erro ao reenviar código:", error);
      setError("Erro ao reenviar código. Tente novamente.");
      toast({
        title: "Erro",
        description: "Não foi possível reenviar o código.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header com background */}
      <div className="relative h-48 bg-gradient-to-b from-primary/20 via-primary/10 to-background flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <Lock className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {stage === "success" ? "Senha Redefinida!" : "Recuperar Senha"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {stage === "request" && "Enviaremos um código para seu email"}
            {stage === "verify" && `Código enviado para ${maskedEmail}`}
            {stage === "success" && "Sua senha foi alterada com sucesso"}
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 px-6 py-8">
        {/* Alerta de erro */}
        {error && (
          <Alert variant="destructive" className="max-w-md mx-auto mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {stage === "request" && (
          <form onSubmit={handleRequestReset} className="space-y-6 max-w-md mx-auto">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground text-xs uppercase tracking-wider">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-muted border-0 rounded-xl"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar código"}
              {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>

            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para login
            </button>
          </form>
        )}

        {stage === "verify" && (
          <form onSubmit={handleVerifyAndReset} className="space-y-6 max-w-md mx-auto">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                Código de verificação
              </Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={(value) => setCode(value)}
                >
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="w-12 h-14 text-xl rounded-xl bg-muted border-0"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-muted-foreground text-xs uppercase tracking-wider">
                Nova senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-muted border-0 rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-muted-foreground text-xs uppercase tracking-wider">
                Confirmar senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-muted border-0 rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              disabled={loading}
            >
              {loading ? "Redefinindo..." : "Redefinir senha"}
              {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>

            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="text-primary hover:text-primary/80 text-sm transition-colors disabled:opacity-50"
              >
                Não recebeu? Reenviar código
              </button>
              <button
                type="button"
                onClick={() => setStage("request")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
            </div>
          </form>
        )}

        {stage === "success" && (
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <p className="text-muted-foreground">
              Sua senha foi alterada com sucesso. Agora você pode fazer login com sua nova senha.
            </p>
            <Button
              onClick={() => navigate("/auth")}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              Fazer login
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
