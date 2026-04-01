import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, User, ClipboardList, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AccountType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number;
}

const iconMap: Record<string, React.ReactNode> = {
  user: <User className="h-8 w-8" />,
  clipboard: <ClipboardList className="h-8 w-8" />,
  shield: <Shield className="h-8 w-8" />,
};

const ChooseAccountType = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already has account_type, redirect to complete-profile
  useEffect(() => {
    if (profile && (profile as any).account_type) {
      navigate("/complete-profile", { replace: true });
    }
  }, [profile, navigate]);

  // Load account types
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("account_types")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (data) setAccountTypes(data as AccountType[]);
      setLoading(false);
    };
    load();
  }, []);

  const handleContinue = async () => {
    if (!selected || !user) return;
    setSubmitting(true);

    const selectedType = accountTypes.find((t) => t.id === selected);
    if (!selectedType) return;

    // Determine if gender selection is needed (not for "time")
    const needsGender = selectedType.slug !== "time";

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ account_type: selectedType.slug })
        .eq("id", user.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      navigate("/complete-profile", { replace: true });
    } catch (err) {
      console.error("Error setting account type:", err);
      toast.error("Erro ao salvar tipo de conta. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (profileLoading || loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center pt-16 pb-6">
        <img
          src="https://wdgpmpgdlauiawbtbxmn.supabase.co/storage/v1/object/public/site-assets/SOCCERVITAE_LOGO_NOVO_verde.png"
          alt="SOCCER VITAE"
          className="h-7 w-auto object-contain"
        />
      </div>

      <div className="flex-1 px-6 pb-8">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">
              Qual é o seu perfil?
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Escolha o tipo de conta que melhor se encaixa com você
            </p>
          </div>

          <div className="space-y-3">
            {accountTypes.map((type) => {
              const isSelected = selected === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelected(type.id)}
                  className={`w-full p-5 rounded-2xl border-2 transition-all duration-200 text-left flex items-center gap-4 ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {iconMap[type.icon || "user"] || <User className="h-8 w-8" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-base">
                      {type.name}
                    </h3>
                    {type.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {type.description}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <Button
            onClick={handleContinue}
            disabled={!selected || submitting}
            className="w-full h-12 text-base font-semibold mt-8 rounded-xl"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Salvando...
              </>
            ) : (
              "Continuar"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChooseAccountType;
