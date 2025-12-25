import { useState, useEffect } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

interface TwoFactorInputProps {
  onComplete: (code: string) => void;
  onResend: () => void;
  isVerifying?: boolean;
  isResending?: boolean;
  maskedEmail?: string;
}

const TwoFactorInput = ({
  onComplete,
  onResend,
  isVerifying = false,
  isResending = false,
  maskedEmail,
}: TwoFactorInputProps) => {
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

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
      onComplete(code);
    }
  }, [code, onComplete]);

  const handleResend = () => {
    if (!canResend || isResending) return;
    setCanResend(false);
    setCountdown(60);
    setCode("");
    onResend();
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {maskedEmail && (
        <p className="text-sm text-muted-foreground text-center">
          Enviamos um código de 6 dígitos para{" "}
          <span className="font-medium text-foreground">{maskedEmail}</span>
        </p>
      )}

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
            className="text-primary hover:text-primary-dark"
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
  );
};

export default TwoFactorInput;
