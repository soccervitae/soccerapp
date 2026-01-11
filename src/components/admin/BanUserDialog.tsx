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
import { Ban } from "lucide-react";

interface BanUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  userName?: string;
  isPending?: boolean;
}

export function BanUserDialog({
  open,
  onOpenChange,
  onConfirm,
  userName,
  isPending,
}: BanUserDialogProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason.trim() || "Violação das diretrizes da comunidade");
    setReason("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setReason("");
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
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

        <div className="space-y-2 py-4">
          <Label htmlFor="ban-reason">Motivo do banimento</Label>
          <Textarea
            id="ban-reason"
            placeholder="Informe o motivo do banimento (ex: Violação das diretrizes, spam, comportamento inadequado...)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px]"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {reason.length}/500 caracteres
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Banindo..." : "Confirmar Banimento"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
