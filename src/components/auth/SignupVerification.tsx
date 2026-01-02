import { useState, useEffect } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Mail, CheckCircle, Lock } from "lucide-react";
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
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Mask email for display
  const maskedEmail = (() => {
    const parts = email.split("@");
    return parts[0].substring(0, 3) + "***@" + parts[1];
  })();

  // Resend countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Lock countdown
  useEffect(() => {
    if (lockCountdown > 0) {
      const timer = setTimeout(() => setLockCountdown(lockCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockCountdown === 0) {
      setIsLocked(false);
      setRemainingAttempts(null);
    }
  }, [lockCountdown, isLocked]);

  useEffect(() => {
    if (code.length === 6 && !isLocked) {
      handleVerify();
    }
  }, [code, isLocked]);

  const handleVerify = async () => {
    if (code.length !== 6 || isLocked) return;
    
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
        // Check if account is locked
        if (data.locked && data.locked_until) {
          const lockedUntil = new Date(data.locked_until);
          const remainingSeconds = Math.max(0, Math.ceil((lockedUntil.getTime() - Date.now()) / 1000));
          setIsLocked(true);
          setLockCountdown(remainingSeconds);
          setRemainingAttempts(0);
        } else if (data.remaining_attempts !== undefined) {
          setRemainingAttempts(data.remaining_attempts);
          toast.error(data.error);
        } else {
          toast.error(data.error);
        }
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
        setIsLocked(false);
        setLockCountdown(0);
        setRemainingAttempts(null);
      }
    } catch (err) {
      toast.error("Erro ao reenviar código");
    } finally {
      setIsResending(false);
    }
  };

  const formatLockTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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

  // Locked state
  if (isLocked) {
    return (
      <div className="text-center py-6 space-y-6">
        <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-300">
          <Lock className="h-10 w-10 text-destructive" />
        </div>
        
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
          <h3 className="text-xl font-semibold text-foreground">
            Conta temporariamente bloqueada
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Muitas tentativas incorretas. Aguarde para tentar novamente.
          </p>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
          <div className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-destructive/5 border border-destructive/20 rounded-xl">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Tempo restante</p>
              <p className="text-3xl font-mono font-bold text-destructive">
                {formatLockTime(lockCountdown)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500">
          <Button
            onClick={handleResend}
            variant="outline"
            className="w-full"
            disabled={isResending || !canResend}
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reenviando...
              </>
            ) : !canResend ? (
              <>Reenviar código em {countdown}s</>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Solicitar novo código
              </>
            )}
          </Button>
          
          <Button
            onClick={onBack}
            variant="ghost"
            className="w-full"
          >
            Voltar para o cadastro
          </Button>
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

        {/* Remaining attempts warning */}
        {remainingAttempts !== null && remainingAttempts > 0 && remainingAttempts <= 3 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-600 text-sm animate-in fade-in duration-200">
            <span>⚠️</span>
            <span>{remainingAttempts} tentativa{remainingAttempts > 1 ? 's' : ''} restante{remainingAttempts > 1 ? 's' : ''}</span>
          </div>
        )}

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
