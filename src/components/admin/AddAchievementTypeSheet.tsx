import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AchievementType {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  category: string | null;
  color: string | null;
}

interface AddAchievementTypeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: AchievementType | null;
}

export function AddAchievementTypeSheet({
  open,
  onOpenChange,
  editData,
}: AddAchievementTypeSheetProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏆");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState("#6366f1");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setIcon(editData.icon);
      setDescription(editData.description || "");
      setCategory(editData.category || "");
      setColor(editData.color || "#6366f1");
    } else {
      setName("");
      setIcon("🏆");
      setDescription("");
      setCategory("");
      setColor("#6366f1");
    }
  }, [editData, open]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("achievement_types").insert({
        name,
        icon,
        description: description || null,
        category: category || null,
        color: color || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAchievementTypes"] });
      toast.success("Tipo de conquista criado com sucesso");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao criar tipo de conquista");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editData) return;
      const { error } = await supabase
        .from("achievement_types")
        .update({
          name,
          icon,
          description: description || null,
          category: category || null,
          color: color || null,
        })
        .eq("id", editData.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAchievementTypes"] });
      toast.success("Tipo de conquista atualizado com sucesso");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao atualizar tipo de conquista");
    },
  });

  const handleSubmit = () => {
    if (!name.trim() || !icon.trim()) {
      toast.error("Nome e ícone são obrigatórios");
      return;
    }

    if (editData) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="sm:max-w-md">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            {editData ? "Editar Tipo de Conquista" : "Adicionar Tipo de Conquista"}
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>

        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              placeholder="Ex: Campeão"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Ícone (emoji) *</Label>
            <Input
              id="icon"
              placeholder="🏆"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição do tipo de conquista..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              placeholder="Ex: Títulos, Prêmios Individuais..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Cor</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-14 rounded border border-border cursor-pointer"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#6366f1"
                className="flex-1"
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isPending || !name.trim() || !icon.trim()}
            className="w-full"
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editData ? "Salvar Alterações" : "Adicionar"}
          </Button>
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
