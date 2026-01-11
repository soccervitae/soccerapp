import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Ban, Clock, Infinity } from "lucide-react";
import { addDays, addHours, addMonths, addWeeks, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BanUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, bannedUntil: string | null) => void;
  userName?: string;
  isPending?: boolean;
}

type BanDuration = "permanent" | "1h" | "24h" | "7d" | "30d" | "custom";

export function BanUserDialog({
  open,
  onOpenChange,
  onConfirm,
  userName,
  isPending,
}: BanUserDialogProps) {
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState<BanDuration>("permanent");
  const [customDate, setCustomDate] = useState("");

  const calculateBanUntil = (): string | null => {
    const now = new Date();
    
    switch (duration) {
      case "permanent":
        return null;
      case "1h":
        return addHours(now, 1).toISOString();
      case "24h":
        return addDays(now, 1).toISOString();
      case "7d":
        return addWeeks(now, 1).toISOString();
      case "30d":
        return addMonths(now, 1).toISOString();
      case "custom":
        if (customDate) {
          const date = new Date(customDate);
          date.setHours(23, 59, 59, 999);
          return date.toISOString();
        }
        return null;
      default:
        return null;
    }
  };

  const handleConfirm = () => {
    const bannedUntil = calculateBanUntil();
    onConfirm(reason.trim() || "Violação das diretrizes da comunidade", bannedUntil);
    resetForm();
  };

  const resetForm = () => {
    setReason("");
    setDuration("permanent");
    setCustomDate("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const getMinDate = () => {
    const tomorrow = addDays(new Date(), 1);
    return format(tomorrow, "yyyy-MM-dd");
  };

  const getDurationLabel = () => {
    const bannedUntil = calculateBanUntil();
    if (!bannedUntil) return "Banimento permanente";
    return `Até ${format(new Date(bannedUntil), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Banir Usuário
          </AlertDialogTitle>
          <AlertDialogDescription>
            {userName ? (
              <>Você está prestes a banir <strong>@{userName}</strong>. </>
            ) : (
              "Você está prestes a banir este usuário. "
            )}
            Esta ação impedirá o usuário de acessar a plataforma.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Ban Duration */}
          <div className="space-y-3">
            <Label>Duração do banimento</Label>
            <RadioGroup
              value={duration}
              onValueChange={(value) => setDuration(value as BanDuration)}
              className="grid grid-cols-2 gap-2"
            >
              <div className="flex items-center space-x-2 rounded-md border border-border p-3 hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="permanent" id="permanent" />
                <Label htmlFor="permanent" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Infinity className="h-4 w-4 text-destructive" />
                  Permanente
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border border-border p-3 hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="1h" id="1h" />
                <Label htmlFor="1h" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Clock className="h-4 w-4" />
                  1 hora
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border border-border p-3 hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="24h" id="24h" />
                <Label htmlFor="24h" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Clock className="h-4 w-4" />
                  24 horas
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border border-border p-3 hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="7d" id="7d" />
                <Label htmlFor="7d" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Clock className="h-4 w-4" />
                  7 dias
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border border-border p-3 hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="30d" id="30d" />
                <Label htmlFor="30d" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Clock className="h-4 w-4" />
                  30 dias
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border border-border p-3 hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Clock className="h-4 w-4" />
                  Personalizado
                </Label>
              </div>
            </RadioGroup>

            {duration === "custom" && (
              <div className="pt-2">
                <Label htmlFor="custom-date">Data de expiração</Label>
                <Input
                  id="custom-date"
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={getMinDate()}
                  className="mt-1"
                />
              </div>
            )}

            {duration !== "permanent" && (
              <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                {getDurationLabel()}
              </p>
            )}
          </div>

          {/* Ban Reason */}
          <div className="space-y-2">
            <Label htmlFor="ban-reason">Motivo do banimento</Label>
            <Textarea
              id="ban-reason"
              placeholder="Informe o motivo do banimento (ex: Violação das diretrizes, spam, comportamento inadequado...)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {reason.length}/500 caracteres
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending || (duration === "custom" && !customDate)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Banindo..." : "Confirmar Banimento"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
