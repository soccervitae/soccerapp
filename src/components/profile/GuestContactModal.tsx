import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

const contactSchema = z.object({
  sender_name: z.string().trim().min(1, "Nome é obrigatório").max(100),
  sender_email: z.string().trim().email("Email inválido").max(255),
  sender_whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
  sender_facebook: z.string().trim().max(100).optional().or(z.literal("")),
  sender_instagram: z.string().trim().max(100).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Mensagem é obrigatória").max(1000),
});

interface GuestContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    id: string;
    username: string;
    full_name?: string | null;
    nickname?: string | null;
    avatar_url?: string | null;
  };
}

export function GuestContactModal({ open, onOpenChange, profile }: GuestContactModalProps) {
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

  const displayName = profile.nickname || profile.full_name || profile.username;

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
      onOpenChange(false);
      setForm({ sender_name: "", sender_email: "", sender_whatsapp: "", sender_facebook: "", sender_instagram: "", message: "" });
      setErrors({});
    } catch {
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-center">Enviar mensagem</DialogTitle>
        </DialogHeader>
        <ScrollArea className="px-6 pb-6 max-h-[70vh]">
          <div className="flex flex-col items-center py-4 gap-2">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                {(displayName || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="font-bold text-foreground">{displayName}</p>
          </div>

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
            <Button onClick={handleSubmit} disabled={sending} className="w-full h-11 font-semibold rounded">
              {sending ? "Enviando..." : "Enviar mensagem"}
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
