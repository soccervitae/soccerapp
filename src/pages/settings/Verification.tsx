import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SettingsPageLayout } from "@/components/layout/SettingsPageLayout";

export default function Verification() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();

  const isPremium = profile?.is_verified_premium === true;
  const expiresAt = (profile as any)?.verified_premium_expires_at
    ? new Date((profile as any).verified_premium_expires_at)
    : null;
  const isExpired = expiresAt ? expiresAt < new Date() : false;
  const isActive = isPremium && !isExpired;

  const handleGetVerification = () => {
    toast.info("Em breve! O pagamento será integrado.");
  };

  return (
    <SettingsPageLayout title="Plano Pro">
      <div className="px-4">
        {/* Hero */}
        <div className="flex flex-col items-center text-center py-8">
          <span className="material-symbols-outlined text-primary text-[64px] font-bold mb-4">star</span>
          <h2 className="text-2xl font-bold text-foreground">SEJA PRO</h2>
          <p className="text-muted-foreground mt-2 max-w-xs">
            Destaque-se e tenha benefícios exclusivos com o Plano Pro.
          </p>
        </div>

        {/* Price */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6 text-center">
          <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold mb-1">Assinatura anual</p>
          <p className="text-4xl font-black text-foreground">R$ 149,90</p>
          
          <p className="text-sm text-primary font-semibold mt-2">ou 12x de R$ 14,90</p>
        </div>

        {/* Benefits */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Benefícios inclusos</p>
          <div className="space-y-3">
            <BenefitItem icon="verified" text="Selo de verificação no perfil" />
            <BenefitItem icon="edit" text="Alterar nome de usuário quando quiser" />
            <BenefitItem icon="star" text="Destaque no feed e nas buscas" />
            <BenefitItem icon="support_agent" text="Suporte prioritário" />
          </div>
        </div>

        {/* Status or CTA */}
        {isActive ? (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
              <span className="font-bold text-primary">Plano Pro Ativo</span>
            </div>
            {expiresAt && (
              <p className="text-sm text-muted-foreground">
                Válido até {format(expiresAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            )}
          </div>
        ) : (
          <button
            onClick={handleGetVerification}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 transition-colors text-base rounded"
          >
            {isPremium && isExpired ? "Renovar Plano Pro" : "Obter Plano Pro"}
          </button>
        )}

        {isPremium && isExpired && (
          <p className="text-center text-sm text-destructive mt-3">
            Seu Plano Pro expirou. Renove para manter o selo.
          </p>
        )}
      </div>
    </SettingsPageLayout>
  );
}

function BenefitItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-primary text-[18px]">{icon}</span>
      </div>
      <span className="text-sm text-foreground">{text}</span>
    </div>
  );
}
