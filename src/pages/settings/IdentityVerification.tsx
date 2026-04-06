import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SettingsPageLayout } from "@/components/layout/SettingsPageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const DOCUMENT_TYPES = [
  { value: "rg", label: "RG" },
  { value: "cpf", label: "CPF" },
  { value: "cnh", label: "CNH" },
  { value: "passaporte", label: "Passaporte" },
];

export default function IdentityVerification() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [fullName, setFullName] = useState("");
  const [documentType, setDocumentType] = useState("rg");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const isVerified = (profile as any)?.is_identity_verified === true;

  const { data: existingRequest, refetch } = useQuery({
    queryKey: ["verification-request", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("verification_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentFile(file);
      setDocumentPreview(URL.createObjectURL(file));
    }
  };

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!user?.id || !documentFile || !selfieFile || !fullName.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsSubmitting(true);
    try {
      const docExt = documentFile.name.split(".").pop();
      const selfieExt = selfieFile.name.split(".").pop();
      const timestamp = Date.now();

      const docPath = `${user.id}/document_${timestamp}.${docExt}`;
      const selfiePath = `${user.id}/selfie_${timestamp}.${selfieExt}`;

      const [docUpload, selfieUpload] = await Promise.all([
        supabase.storage.from("verification-docs").upload(docPath, documentFile),
        supabase.storage.from("verification-docs").upload(selfiePath, selfieFile),
      ]);

      if (docUpload.error) throw docUpload.error;
      if (selfieUpload.error) throw selfieUpload.error;

      const { data: insertedReq, error } = await supabase.from("verification_requests").insert({
        user_id: user.id,
        document_url: docPath,
        selfie_url: selfiePath,
        full_name: fullName.trim(),
        document_type: documentType,
      }).select("id").single();

      if (error) throw error;

      // Trigger AI validation in background
      if (insertedReq?.id) {
        supabase.functions.invoke("validate-document", {
          body: { requestId: insertedReq.id },
        }).catch(console.error);
      }

      toast.success("Solicitação enviada com sucesso! A IA está analisando seus documentos.");
      setDocumentFile(null);
      setSelfieFile(null);
      setDocumentPreview(null);
      setSelfiePreview(null);
      setFullName("");
      setDocumentType("rg");
      refetch();
    } catch (err: any) {
      toast.error("Erro ao enviar solicitação");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPending = existingRequest?.status === "pending";
  const isRejected = existingRequest?.status === "rejected";

  return (
    <SettingsPageLayout title="Verificação de Identidade">
      <div className="px-4">
        {/* Hero */}
        <div className="flex flex-col items-center text-center py-8">
          <span className="material-symbols-outlined text-primary text-[64px] font-bold mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          <h2 className="text-2xl font-bold text-foreground">Selo de Verificação</h2>
          <p className="text-muted-foreground mt-2 max-w-xs">
            Confirme sua identidade e receba o selo de verificado no seu perfil.
          </p>
        </div>

        {isVerified ? (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span className="font-bold text-primary">Identidade Verificada</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Seu perfil possui o selo de verificação.
            </p>
          </div>
        ) : isPending ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="material-symbols-outlined text-amber-500 text-[20px]">schedule</span>
              <span className="font-bold text-amber-600">Solicitação em Análise</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Sua solicitação está sendo analisada pela IA. Você receberá uma resposta em breve.
            </p>
          </div>
        ) : (
          <>
            {isRejected && existingRequest?.rejection_reason && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-destructive text-[20px]">cancel</span>
                  <span className="font-bold text-destructive">Solicitação Rejeitada</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Motivo: {existingRequest.rejection_reason}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Você pode enviar uma nova solicitação.
                </p>
              </div>
            )}

            {/* Requirements */}
            <div className="bg-card rounded-xl border border-border p-4 mb-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">O que você precisa</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-[18px]">badge</span>
                  </div>
                  <span className="text-sm text-foreground">Documento com foto (RG, CPF, CNH ou Passaporte)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-[18px]">photo_camera</span>
                  </div>
                  <span className="text-sm text-foreground">Selfie segurando o documento</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-[18px]">smart_toy</span>
                  </div>
                  <span className="text-sm text-foreground">Análise automática por IA</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4 mb-6">
              <div>
                <Label className="text-sm font-medium">Nome completo (como no documento)</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Tipo de documento</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((dt) => (
                      <SelectItem key={dt.value} value={dt.value}>
                        {dt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Foto do documento</Label>
                <div className="mt-1">
                  {documentPreview ? (
                    <div className="relative">
                      <img src={documentPreview} alt="Documento" className="w-full h-40 object-cover rounded-lg border border-border" />
                      <button
                        onClick={() => { setDocumentFile(null); setDocumentPreview(null); }}
                        className="absolute top-2 right-2 bg-background/80 rounded-full p-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <span className="material-symbols-outlined text-muted-foreground text-[32px] mb-1">upload_file</span>
                      <span className="text-sm text-muted-foreground">Toque para enviar</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleDocumentChange} />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Selfie com o documento</Label>
                <div className="mt-1">
                  {selfiePreview ? (
                    <div className="relative">
                      <img src={selfiePreview} alt="Selfie" className="w-full h-40 object-cover rounded-lg border border-border" />
                      <button
                        onClick={() => { setSelfieFile(null); setSelfiePreview(null); }}
                        className="absolute top-2 right-2 bg-background/80 rounded-full p-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <span className="material-symbols-outlined text-muted-foreground text-[32px] mb-1">selfie</span>
                      <span className="text-sm text-muted-foreground">Toque para enviar</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleSelfieChange} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !documentFile || !selfieFile || !fullName.trim()}
              className="w-full font-bold py-4 text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar para Verificação"
              )}
            </Button>
          </>
        )}
      </div>
    </SettingsPageLayout>
  );
}
