import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Bell, FileSearch, ArrowRight } from "lucide-react";

interface ModerationInfoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ModerationInfoSheet = ({ open, onOpenChange }: ModerationInfoSheetProps) => {
  const navigate = useNavigate();

  const handleGoToMyPosts = () => {
    onOpenChange(false);
    navigate("/settings/my-posts");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8 pt-6">
        <SheetHeader className="mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <SheetTitle className="text-xl text-center">
            Seu post está sendo analisado
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileSearch className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-sm">Análise automática</p>
              <p className="text-xs text-muted-foreground">
                Seu conteúdo está passando por uma análise automática para garantir que segue nossas diretrizes da comunidade.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bell className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-sm">Você será notificado</p>
              <p className="text-xs text-muted-foreground">
                Assim que a análise for concluída, você receberá uma notificação com o resultado.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleGoToMyPosts}
            variant="outline"
            className="w-full justify-between"
          >
            <span>Ver meus posts e moderação</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Entendi
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
