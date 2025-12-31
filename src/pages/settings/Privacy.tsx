import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PrivacySettings {
  is_private: boolean;
  show_activity_status: boolean;
  show_profile_to: "everyone" | "followers" | "nobody";
}

const Privacy = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings>({
    is_private: false,
    show_activity_status: true,
    show_profile_to: "everyone",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("is_private, show_activity_status, show_profile_to")
        .eq("id", user.id)
        .single();

      if (error) {
        toast.error("Erro ao carregar configurações");
        return;
      }

      if (data) {
        setSettings({
          is_private: data.is_private ?? false,
          show_activity_status: data.show_activity_status ?? true,
          show_profile_to: (data.show_profile_to as PrivacySettings["show_profile_to"]) ?? "everyone",
        });
      }
      setLoading(false);
    };

    fetchSettings();
  }, [user]);

  const updateSetting = async <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => {
    if (!user) return;

    setSaving(true);
    setSettings((prev) => ({ ...prev, [key]: value }));

    const { error } = await supabase
      .from("profiles")
      .update({ [key]: value })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      toast.error("Erro ao salvar configuração");
      // Revert on error
      setSettings((prev) => ({ ...prev, [key]: !value }));
    }
  };

  const visibilityLabels = {
    everyone: "Todos",
    followers: "Apenas torcedores",
    nobody: "Ninguém",
  };

  return (
    <main className="bg-background min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-foreground transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h1 className="text-base font-bold text-foreground tracking-wide">Privacidade</h1>
        <div className="w-10 h-10" />
      </header>

      <div className="pt-16 px-4 pb-8">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Conta Privada */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[20px]">lock</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Conta privada</p>
                    <p className="text-xs text-muted-foreground">
                      Apenas torcedores aprovados podem ver seu conteúdo
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.is_private}
                  onCheckedChange={(checked) => updateSetting("is_private", checked)}
                  disabled={saving}
                />
              </div>
            </div>

            {/* Status de Atividade */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-500 text-[20px]">
                      circle
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Status de atividade</p>
                    <p className="text-xs text-muted-foreground">
                      Mostrar quando você está online
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.show_activity_status}
                  onCheckedChange={(checked) => updateSetting("show_activity_status", checked)}
                  disabled={saving}
                />
              </div>
            </div>

            {/* Visibilidade do Perfil */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-blue-500 text-[20px]">
                    visibility
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Quem pode ver seu perfil</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Controle quem pode visualizar suas informações
                  </p>
                  <Select
                    value={settings.show_profile_to}
                    onValueChange={(value: PrivacySettings["show_profile_to"]) =>
                      updateSetting("show_profile_to", value)
                    }
                    disabled={saving}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">{visibilityLabels.everyone}</SelectItem>
                      <SelectItem value="followers">{visibilityLabels.followers}</SelectItem>
                      <SelectItem value="nobody">{visibilityLabels.nobody}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-muted-foreground text-[20px]">
                  info
                </span>
                <p className="text-xs text-muted-foreground">
                  Mesmo com conta privada, seu nome de usuário e foto de perfil ainda podem ser
                  visíveis para todos.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Privacy;
