import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { z } from "zod";

const contactSchema = z.object({
  sender_name: z.string().trim().min(1, "Nome é obrigatório").max(100),
  sender_email: z.string().trim().email("Email inválido").max(255),
  sender_whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
  sender_facebook: z.string().trim().max(100).optional().or(z.literal("")),
  sender_instagram: z.string().trim().max(100).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Mensagem é obrigatória").max(1000),
});

export default function ContactProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    sender_name: "",
    sender_email: "",
    sender_whatsapp: "",
    sender_facebook: "",
    sender_instagram: "",
    message: "",
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["contact-profile", username],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, nickname, avatar_url, gender, account_type, funcao, posicaomas, posicaofem")
        .eq("username", username)
        .single();
      if (!data) throw new Error("Profile not found");

      let positionName: string | null = null;

      if (data.account_type === "comissao_tecnica" && data.funcao) {
        const gender = data.gender;
        const table = gender === "feminino" ? "funcaofem" : "funcaomas";
        const { data: funcData } = await supabase.from(table).select("name").eq("id", data.funcao).single();
        positionName = funcData?.name || null;
      } else if (data.account_type === "atleta") {
        const gender = data.gender;
        if (gender === "feminino" && data.posicaofem) {
          const { data: posData } = await supabase.from("posicao_feminina").select("name").eq("id", data.posicaofem).single();
          positionName = posData?.name || null;
        } else if (data.posicaomas) {
          const { data: posData } = await supabase.from("posicao_masculina").select("name").eq("id", data.posicaomas).single();
          positionName = posData?.name || null;
        }
      }

      return { ...data, position_name: positionName };
    },
    enabled: !!username,
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async () => {
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(e => {
        if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!profile?.id) return;
    setSending(true);
    try {
      const { error } = await supabase.from("guest_messages" as any).insert({
        profile_id: profile.id,
        sender_name: result.data.sender_name,
        sender_email: result.data.sender_email,
        sender_whatsapp: result.data.sender_whatsapp || null,
        sender_facebook: result.data.sender_facebook || null,
        sender_instagram: result.data.sender_instagram || null,
        message: result.data.message,
      } as any);
      if (error) throw error;
      toast.success("Mensagem enviada com sucesso!");
      navigate(`/${username}`);
    } catch {
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Perfil não encontrado</p>
      </div>
    );
  }

  const displayName = profile.nickname || profile.full_name || profile.username;

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 h-[50px] flex items-center">
        <button onClick={() => navigate(`/${username}`)} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-foreground transition-colors">
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h1 className="text-base font-bold text-foreground ml-2">Enviar mensagem</h1>
      </header>

      <div className="pt-[50px] pb-20 px-4 max-w-lg mx-auto">
        {/* Profile header */}
        <div className="flex flex-col items-center py-6 gap-2">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
              {(displayName || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="font-bold text-lg text-foreground">{displayName}</p>
          {profile.position_name && (
            <p className="text-sm text-muted-foreground">{profile.position_name}</p>
          )}
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Nome *</label>
            <Input value={form.sender_name} onChange={e => handleChange("sender_name", e.target.value)} placeholder="Seu nome" />
            {errors.sender_name && <p className="text-xs text-destructive mt-1">{errors.sender_name}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Email *</label>
            <Input type="email" value={form.sender_email} onChange={e => handleChange("sender_email", e.target.value)} placeholder="seu@email.com" />
            {errors.sender_email && <p className="text-xs text-destructive mt-1">{errors.sender_email}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">WhatsApp</label>
            <Input value={form.sender_whatsapp} onChange={e => handleChange("sender_whatsapp", e.target.value)} placeholder="+55 11 99999-9999" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Facebook</label>
            <Input value={form.sender_facebook} onChange={e => handleChange("sender_facebook", e.target.value)} placeholder="facebook.com/usuario" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Instagram</label>
            <Input value={form.sender_instagram} onChange={e => handleChange("sender_instagram", e.target.value)} placeholder="@usuario" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Mensagem *</label>
            <Textarea value={form.message} onChange={e => handleChange("message", e.target.value)} placeholder="Escreva sua mensagem..." rows={4} maxLength={1000} />
            {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
            <p className="text-xs text-muted-foreground mt-1 text-right">{form.message.length}/1000</p>
          </div>
          <Button onClick={handleSubmit} disabled={sending} className="w-full h-11 rounded-full font-semibold">
            {sending ? "Enviando..." : "Enviar mensagem"}
          </Button>
        </div>
      </div>
    </div>
  );
}
