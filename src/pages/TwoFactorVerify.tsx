import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import TwoFactorInput from "@/components/auth/TwoFactorInput";
import { ArrowLeft, ShieldCheck } from "lucide-react";

interface LocationState {
  email: string;
  userId: string;
  maskedEmail: string;
}

const TwoFactorVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const state = location.state as LocationState | null;

  useEffect(() => {
    // Redirect if no state (direct access without login)
    if (!state?.email || !state?.userId) {
      navigate("/login", { replace: true });
    }
  }, [state, navigate]);

  if (!state?.email || !state?.userId) {
    return null;
  }

  const handleVerifyCode = async (code: string) => {
    setIsVerifying(true);

    try {
      // Verify the code against the stored code in profiles
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("codigo, codigo_expira_em")
        .eq("id", state.userId)
        .single();

      if (error) throw error;

      // Check if code is expired
      if (profile.codigo_expira_em && new Date(profile.codigo_expira_em) < new Date()) {
        toast({
          variant: "destructive",
          title: "Código expirado",
          description: "Solicite um novo código de verificação.",
        });
        setIsVerifying(false);
        return;
      }

      // Check if code matches
      if (profile.codigo !== code) {
        toast({
          variant: "destructive",
          title: "Código inválido",
          description: "O código informado não está correto.",
        });
        setIsVerifying(false);
        return;
      }

      // Clear the code from the database
      await supabase
        .from("profiles")
        .update({ codigo: null, codigo_expira_em: null })
        .eq("id", state.userId);

      toast({
        title: "Verificação concluída!",
        description: "Login realizado com sucesso.",
      });

      // Navigate to home
      navigate("/", { replace: true });
    } catch (error: any) {
      console.error("Error verifying 2FA code:", error);
      toast({
        variant: "destructive",
        title: "Erro na verificação",
        description: "Ocorreu um erro ao verificar o código. Tente novamente.",
      });
    }

    setIsVerifying(false);
  };

  const handleResendCode = async () => {
    setIsResending(true);

    try {
      const { error } = await supabase.functions.invoke("send-2fa-code", {
        body: {
          email: state.email,
          user_id: state.userId,
        },
      });

      if (error) throw error;

      toast({
        title: "Código reenviado!",
        description: "Verifique sua caixa de entrada.",
      });
    } catch (error: any) {
      console.error("Error resending 2FA code:", error);
      toast({
        variant: "destructive",
        title: "Erro ao reenviar",
        description: "Não foi possível reenviar o código. Tente novamente.",
      });
    }

    setIsResending(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with gradient */}
      <div className="relative h-48 bg-gradient-to-br from-primary via-primary-dark to-emerald-700 flex items-end justify-center pb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
        <h1 className="text-3xl font-bold text-primary-foreground relative z-10">
          ⚽ SportConnect
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 -mt-8 bg-background rounded-t-3xl px-6 pt-8 pb-6">
        <div className="max-w-sm mx-auto">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground text-center">
              Verificação em duas etapas
            </h2>
            <p className="text-muted-foreground mt-2 text-center">
              Digite o código que enviamos para seu email
            </p>
          </div>

          <TwoFactorInput
            onComplete={handleVerifyCode}
            onResend={handleResendCode}
            isVerifying={isVerifying}
            isResending={isResending}
            maskedEmail={state.maskedEmail}
          />

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorVerify;
