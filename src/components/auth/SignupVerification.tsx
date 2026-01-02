import { useState, useEffect } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Mail, ArrowRight, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SignupVerificationProps {
  email: string;
  userId: string;
  firstName: string;
  onVerified: () => void;
  onBack: () => void;
}

const SignupVerification = ({
  email,
  userId,
  firstName,
  onVerified,
  onBack,
}: SignupVerificationProps) => {
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Mask email for display
  const maskedEmail = (() => {
    const parts = email.split("@");
    return parts[0].substring(0, 3) + "***@" + parts[1];
  })();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  useEffect(() => {
    if (code.length === 6) {
      handleVerify();
    }
  }, [code]);

  const handleVerify = async () => {
    if (code.length !== 6) return;
    
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-signup-code", {
        body: {
          user_id: userId,
          code: code,
        },
      });

      if (error) {
        console.error("Error verifying code:", error);
        toast.error("Erro ao verificar código");
        setCode("");
        setIsVerifying(false);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        setCode("");
        setIsVerifying(false);
        return;
      }

      // Success!
      setIsVerified(true);
      toast.success("Conta verificada com sucesso!");
      
      // Wait a moment to show success state then proceed
      setTimeout(() => {
        onVerified();
      }, 1500);
    } catch (err: any) {
      console.error("Error:", err);
      toast.error("Erro ao verificar código");
      setCode("");
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;
    
    setIsResending(true);
    try {
      const { error } = await supabase.functions.invoke("send-signup-verification", {
        body: {
          email: email,
          user_id: userId,
          first_name: firstName,
        },
      });

      if (error) {
        toast.error("Erro ao reenviar código");
      } else {
        toast.success("Código reenviado!");
        setCanResend(false);
        setCountdown(60);
        setCode("");
      }
    } catch (err) {
      toast.error("Erro ao reenviar código");
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return (
      <div className="text-center py-6 space-y-6">
        <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-300">
          <CheckCircle className="h-10 w-10 text-emerald-600" />
        </div>
        
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
          <h3 className="text-xl font-semibold text-foreground">
            Conta verificada!
          </h3>
          <p className="text-muted-foreground text-sm">
            Redirecionando para o login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-6 space-y-6">
      <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-300">
        <Mail className="h-10 w-10 text-primary" />
      </div>
      
      <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
        <h3 className="text-xl font-semibold text-foreground">
          Confirme seu email
        </h3>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Enviamos um código de 6 dígitos para{" "}
          <strong className="text-foreground">{maskedEmail}</strong>
        </p>
      </div>

      <div className="flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
        <div className="relative">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            disabled={isVerifying}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          {isVerifying && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          {!canResend ? (
            <p className="text-sm text-muted-foreground">
              Reenviar código em{" "}
              <span className="font-medium text-foreground">{countdown}s</span>
            </p>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={isResending}
              className="text-primary hover:text-primary/80"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reenviando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reenviar código
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500">
        <Button
          onClick={onBack}
          variant="outline"
          className="w-full"
        >
          Voltar para o cadastro
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Não recebeu o email? Verifique a pasta de spam ou lixo eletrônico.
      </p>
    </div>
  );
};

export default SignupVerification;
