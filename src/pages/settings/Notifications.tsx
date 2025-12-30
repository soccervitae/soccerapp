import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, MessageCircle, Heart, MessageSquare, UserPlus, BookOpen, Star, Shield, Smartphone, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface NotificationPreferences {
  notify_messages: boolean;
  notify_likes: boolean;
  notify_comments: boolean;
  notify_follows: boolean;
  notify_story_replies: boolean;
  notify_highlight_replies: boolean;
  notify_security_events: boolean;
  notify_new_device: boolean;
}

interface SettingItemProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

const SettingItem = ({ icon, iconBg, title, description, checked, onCheckedChange, disabled }: SettingItemProps) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex items-center gap-3 flex-1">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
  </div>
);

const SectionHeader = ({ title }: { title: string }) => (
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
    {title}
  </p>
);

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSupported, permission, requestPermission, isGranted, isDenied } = usePushNotifications();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notify_messages: true,
    notify_likes: true,
    notify_comments: true,
    notify_follows: true,
    notify_story_replies: true,
    notify_highlight_replies: true,
    notify_security_events: true,
    notify_new_device: true,
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("notify_messages, notify_likes, notify_comments, notify_follows, notify_story_replies, notify_highlight_replies, notify_security_events, notify_new_device")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setPreferences({
            notify_messages: data.notify_messages ?? true,
            notify_likes: data.notify_likes ?? true,
            notify_comments: data.notify_comments ?? true,
            notify_follows: data.notify_follows ?? true,
            notify_story_replies: data.notify_story_replies ?? true,
            notify_highlight_replies: data.notify_highlight_replies ?? true,
            notify_security_events: data.notify_security_events ?? true,
            notify_new_device: data.notify_new_device ?? true,
          });
        }
      } catch (error) {
        console.error("Error fetching notification preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [user]);

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user) return;

    setPreferences(prev => ({ ...prev, [key]: value }));
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [key]: value })
        .eq("id", user.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating preference:", error);
      setPreferences(prev => ({ ...prev, [key]: !value }));
      toast.error("Erro ao salvar preferência");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success("Notificações ativadas com sucesso!");
    } else {
      toast.error("Permissão negada. Ative nas configurações do navegador.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Notificações</h1>
          {isSaving && (
            <span className="text-xs text-muted-foreground ml-auto">Salvando...</span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Push Permission Section */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <SectionHeader title="Permissão de Notificações" />
          
          {!isSupported ? (
            <div className="flex items-center gap-3 py-3">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <BellOff className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Não suportado</p>
                <p className="text-xs text-muted-foreground">
                  Seu navegador não suporta notificações push
                </p>
              </div>
            </div>
          ) : isGranted ? (
            <div className="flex items-center gap-3 py-3">
              <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center">
                <BellRing className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Notificações ativas</p>
                <p className="text-xs text-muted-foreground">
                  Você receberá notificações push
                </p>
              </div>
            </div>
          ) : isDenied ? (
            <div className="flex items-center gap-3 py-3">
              <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center">
                <BellOff className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Notificações bloqueadas</p>
                <p className="text-xs text-muted-foreground">
                  Ative nas configurações do seu navegador
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 py-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Ativar notificações</p>
                <p className="text-xs text-muted-foreground">
                  Receba alertas mesmo com o app fechado
                </p>
              </div>
              <Button size="sm" onClick={handleRequestPermission}>
                Ativar
              </Button>
            </div>
          )}
        </div>

        {/* Activity Notifications */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <SectionHeader title="Atividades" />
          
          <div className="divide-y divide-border">
            <SettingItem
              icon={<MessageCircle className="h-4 w-4 text-green-500" />}
              iconBg="bg-green-500/10"
              title="Mensagens diretas"
              description="Novas mensagens recebidas"
              checked={preferences.notify_messages}
              onCheckedChange={(v) => updatePreference("notify_messages", v)}
              disabled={!isGranted}
            />
            <SettingItem
              icon={<Heart className="h-4 w-4 text-pink-500" />}
              iconBg="bg-pink-500/10"
              title="Curtidas"
              description="Quando alguém curtir seus posts"
              checked={preferences.notify_likes}
              onCheckedChange={(v) => updatePreference("notify_likes", v)}
              disabled={!isGranted}
            />
            <SettingItem
              icon={<MessageSquare className="h-4 w-4 text-orange-500" />}
              iconBg="bg-orange-500/10"
              title="Comentários"
              description="Novos comentários em seus posts"
              checked={preferences.notify_comments}
              onCheckedChange={(v) => updatePreference("notify_comments", v)}
              disabled={!isGranted}
            />
            <SettingItem
              icon={<UserPlus className="h-4 w-4 text-purple-500" />}
              iconBg="bg-purple-500/10"
              title="Novos seguidores"
              description="Quando alguém começar a seguir você"
              checked={preferences.notify_follows}
              onCheckedChange={(v) => updatePreference("notify_follows", v)}
              disabled={!isGranted}
            />
          </div>
        </div>

        {/* Stories & Highlights */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <SectionHeader title="Stories e Destaques" />
          
          <div className="divide-y divide-border">
            <SettingItem
              icon={<BookOpen className="h-4 w-4 text-yellow-500" />}
              iconBg="bg-yellow-500/10"
              title="Respostas aos stories"
              description="Quando alguém responder seu story"
              checked={preferences.notify_story_replies}
              onCheckedChange={(v) => updatePreference("notify_story_replies", v)}
              disabled={!isGranted}
            />
            <SettingItem
              icon={<Star className="h-4 w-4 text-amber-500" />}
              iconBg="bg-amber-500/10"
              title="Respostas aos destaques"
              description="Quando alguém responder seu destaque"
              checked={preferences.notify_highlight_replies}
              onCheckedChange={(v) => updatePreference("notify_highlight_replies", v)}
              disabled={!isGranted}
            />
          </div>
        </div>

        {/* Security Notifications */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <SectionHeader title="Segurança" />
          
          <div className="divide-y divide-border">
            <SettingItem
              icon={<Shield className="h-4 w-4 text-red-500" />}
              iconBg="bg-red-500/10"
              title="Alertas de segurança"
              description="Atividades suspeitas na sua conta"
              checked={preferences.notify_security_events}
              onCheckedChange={(v) => updatePreference("notify_security_events", v)}
              disabled={!isGranted}
            />
            <SettingItem
              icon={<Smartphone className="h-4 w-4 text-slate-500" />}
              iconBg="bg-slate-500/10"
              title="Novos dispositivos"
              description="Login em novos dispositivos"
              checked={preferences.notify_new_device}
              onCheckedChange={(v) => updatePreference("notify_new_device", v)}
              disabled={!isGranted}
            />
          </div>
        </div>

        {/* Info box */}
        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-xs text-muted-foreground text-center">
            As preferências só funcionam quando as notificações push estão ativas. 
            Algumas notificações importantes de segurança podem ser enviadas mesmo com preferências desativadas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
