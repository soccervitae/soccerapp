import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2, Monitor, Smartphone, Tablet, Shield, Trash2, ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import TwoFactorInput from "@/components/auth/TwoFactorInput";
import { getCurrentDeviceFingerprint, trustCurrentDevice } from "@/services/deviceService";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserDevice {
  id: string;
  device_name: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  last_used_at: string;
  is_trusted: boolean | null;
  trusted_until: string | null;
  device_fingerprint: string;
}

const Security = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Security options state
  const [notifyNewDevice, setNotifyNewDevice] = useState(true);
  const [notifySecurityEvents, setNotifySecurityEvents] = useState(true);

  // Device to remove
  const [deviceToRemove, setDeviceToRemove] = useState<string | null>(null);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showEnableTwoFactorDialog, setShowEnableTwoFactorDialog] = useState(false);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [isResending2FA, setIsResending2FA] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");

  // Current device fingerprint
  const [currentFingerprint, setCurrentFingerprint] = useState<string | null>(null);

  // Load current device fingerprint
  useEffect(() => {
    const loadFingerprint = async () => {
      const fingerprint = await getCurrentDeviceFingerprint();
      setCurrentFingerprint(fingerprint);
    };
    loadFingerprint();
  }, []);

  // Fetch user profile for security settings
  const { data: profile } = useQuery({
    queryKey: ["profile-security", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("notify_new_device, notify_security_events, two_factor_enabled")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Update state when profile loads
  useEffect(() => {
    if (profile) {
      setNotifyNewDevice(profile.notify_new_device ?? true);
      setNotifySecurityEvents(profile.notify_security_events ?? true);
      setTwoFactorEnabled(profile.two_factor_enabled ?? false);
    }
  }, [profile]);

  // Fetch user devices
  const { data: devices, isLoading: loadingDevices } = useQuery({
    queryKey: ["user-devices", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_devices")
        .select("*")
        .eq("user_id", user.id)
        .order("last_used_at", { ascending: false });
      if (error) throw error;
      return data as UserDevice[];
    },
    enabled: !!user?.id,
  });

  // Update security settings mutation
  const updateSecuritySettings = useMutation({
    mutationFn: async (settings: { notify_new_device?: boolean; notify_security_events?: boolean }) => {
      if (!user?.id) throw new Error("User not found");
      const { error } = await supabase
        .from("profiles")
        .update(settings)
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Configurações atualizadas" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao atualizar configurações" });
    },
  });

  // Toggle device trust mutation
  const toggleDeviceTrust = useMutation({
    mutationFn: async ({ deviceId, isTrusted }: { deviceId: string; isTrusted: boolean }) => {
      const { error } = await supabase
        .from("user_devices")
        .update({ is_trusted: isTrusted })
        .eq("id", deviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-devices"] });
      toast({ title: "Dispositivo atualizado" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao atualizar dispositivo" });
    },
  });

  // Remove device mutation
  const removeDevice = useMutation({
    mutationFn: async (deviceId: string) => {
      const { error } = await supabase
        .from("user_devices")
        .delete()
        .eq("id", deviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-devices"] });
      toast({ title: "Dispositivo removido" });
      setDeviceToRemove(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao remover dispositivo" });
    },
  });

  // Renew trust mutation
  const renewDeviceTrust = useMutation({
    mutationFn: async (deviceId: string) => {
      if (!user?.id) throw new Error("User not found");
      const success = await trustCurrentDevice(user.id);
      if (!success) throw new Error("Failed to renew trust");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-devices"] });
      toast({ title: "Confiança renovada por mais 30 dias" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao renovar confiança" });
    },
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "As senhas não coincidem",
      });
      return;
    }

    setChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao alterar senha",
        description: error.message,
      });
    } else {
      toast({
        title: "Senha alterada com sucesso!",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    }

    setChangingPassword(false);
  };

  const handleNotifyNewDeviceChange = (checked: boolean) => {
    setNotifyNewDevice(checked);
    updateSecuritySettings.mutate({ notify_new_device: checked });
  };

  const handleNotifySecurityEventsChange = (checked: boolean) => {
    setNotifySecurityEvents(checked);
    updateSecuritySettings.mutate({ notify_security_events: checked });
  };

  const handleEnableTwoFactor = async () => {
    if (!user?.email || !user?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke("send-2fa-code", {
        body: {
          email: user.email,
          user_id: user.id,
        },
      });

      if (error) throw error;

      setMaskedEmail(data?.masked_email || user.email);
      setShowEnableTwoFactorDialog(true);
    } catch (error) {
      console.error("Error sending 2FA code:", error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar código",
        description: "Não foi possível enviar o código de verificação.",
      });
    }
  };

  const handleVerify2FACode = async (code: string) => {
    setIsVerifying2FA(true);

    try {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("codigo, codigo_expira_em")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      if (profileData.codigo_expira_em && new Date(profileData.codigo_expira_em) < new Date()) {
        toast({
          variant: "destructive",
          title: "Código expirado",
          description: "Solicite um novo código de verificação.",
        });
        setIsVerifying2FA(false);
        return;
      }

      if (profileData.codigo !== code) {
        toast({
          variant: "destructive",
          title: "Código inválido",
          description: "O código informado não está correto.",
        });
        setIsVerifying2FA(false);
        return;
      }

      // Enable 2FA
      await supabase
        .from("profiles")
        .update({ 
          two_factor_enabled: true,
          codigo: null, 
          codigo_expira_em: null 
        })
        .eq("id", user?.id);

      setTwoFactorEnabled(true);
      setShowEnableTwoFactorDialog(false);
      queryClient.invalidateQueries({ queryKey: ["profile-security"] });
      
      toast({
        title: "Verificação em duas etapas ativada!",
        description: "Sua conta está mais segura agora.",
      });
    } catch (error) {
      console.error("Error verifying 2FA code:", error);
      toast({
        variant: "destructive",
        title: "Erro na verificação",
        description: "Ocorreu um erro ao verificar o código.",
      });
    }

    setIsVerifying2FA(false);
  };

  const handleResend2FACode = async () => {
    if (!user?.email || !user?.id) return;
    setIsResending2FA(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-2fa-code", {
        body: {
          email: user.email,
          user_id: user.id,
        },
      });

      if (error) throw error;

      setMaskedEmail(data?.masked_email || user.email);
      toast({
        title: "Código reenviado!",
        description: "Verifique sua caixa de entrada.",
      });
    } catch (error) {
      console.error("Error resending 2FA code:", error);
      toast({
        variant: "destructive",
        title: "Erro ao reenviar",
        description: "Não foi possível reenviar o código.",
      });
    }

    setIsResending2FA(false);
  };

  const handleDisableTwoFactor = async () => {
    try {
      await supabase
        .from("profiles")
        .update({ two_factor_enabled: false })
        .eq("id", user?.id);

      setTwoFactorEnabled(false);
      queryClient.invalidateQueries({ queryKey: ["profile-security"] });
      
      toast({
        title: "Verificação em duas etapas desativada",
      });
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      toast({
        variant: "destructive",
        title: "Erro ao desativar",
        description: "Não foi possível desativar a verificação em duas etapas.",
      });
    }
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-5 w-5" />;
      case "tablet":
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getDeviceDisplayName = (device: UserDevice) => {
    if (device.device_name) return device.device_name;
    const parts = [];
    if (device.browser) parts.push(device.browser);
    if (device.os) parts.push(`em ${device.os}`);
    return parts.length > 0 ? parts.join(" ") : "Dispositivo desconhecido";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-4 px-4 py-3">
          <button onClick={() => navigate(-1)} className="text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">Segurança</h1>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {/* Change Password Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Alterar Senha</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword.length > 0 && newPassword.length < 6 && (
                <p className="text-xs text-destructive">Mínimo de 6 caracteres</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirmar nova senha</Label>
              <Input
                id="confirmNewPassword"
                type={showPasswords ? "text" : "password"}
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
              {confirmNewPassword.length > 0 && newPassword !== confirmNewPassword && (
                <p className="text-xs text-destructive">As senhas não coincidem</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={changingPassword || newPassword.length < 6 || newPassword !== confirmNewPassword}
            >
              {changingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Alterando...
                </>
              ) : (
                "Alterar senha"
              )}
            </Button>
          </form>
        </section>

        <Separator />

        {/* Two-Factor Authentication Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Verificação em Duas Etapas</h2>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium text-sm">
                  {twoFactorEnabled ? "Ativada" : "Desativada"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {twoFactorEnabled
                    ? "Um código será enviado para seu email ao fazer login"
                    : "Adicione uma camada extra de segurança à sua conta"}
                </p>
              </div>
              {twoFactorEnabled ? (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  Ativo
                </span>
              ) : null}
            </div>

            <Button
              variant={twoFactorEnabled ? "outline" : "default"}
              className="w-full"
              onClick={twoFactorEnabled ? handleDisableTwoFactor : handleEnableTwoFactor}
            >
              {twoFactorEnabled ? "Desativar verificação" : "Ativar verificação"}
            </Button>
          </div>
        </section>

        <Separator />

        {/* Connected Devices Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Dispositivos Conectados</h2>
          </div>

          {loadingDevices ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : devices && devices.length > 0 ? (
            <div className="space-y-3">
              {devices.map((device) => {
                const isCurrentDevice = device.device_fingerprint === currentFingerprint;
                const trustExpired = device.trusted_until && new Date(device.trusted_until) < new Date();
                const isTrustedAndValid = device.is_trusted && !trustExpired;
                
                return (
                  <div
                    key={device.id}
                    className={`flex items-start gap-3 p-4 rounded-lg ${
                      isCurrentDevice ? "bg-primary/5 border border-primary/20" : "bg-muted/50"
                    }`}
                  >
                    <div className="text-muted-foreground">
                      {getDeviceIcon(device.device_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">
                          {getDeviceDisplayName(device)}
                        </p>
                        {isCurrentDevice && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            Este dispositivo
                          </span>
                        )}
                        {isTrustedAndValid && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Confiável
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Última atividade:{" "}
                        {formatDistanceToNow(new Date(device.last_used_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                      {device.is_trusted && device.trusted_until && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {trustExpired ? (
                            <span className="text-destructive">Confiança expirada</span>
                          ) : (
                            <>Confiança expira em {format(new Date(device.trusted_until), "dd/MM/yyyy", { locale: ptBR })}</>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isCurrentDevice && device.is_trusted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => renewDeviceTrust.mutate(device.id)}
                          disabled={renewDeviceTrust.isPending}
                          title="Renovar confiança por 30 dias"
                        >
                          <RefreshCw className={`h-4 w-4 ${renewDeviceTrust.isPending ? "animate-spin" : ""}`} />
                        </Button>
                      )}
                      {!isCurrentDevice && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleDeviceTrust.mutate({
                              deviceId: device.id,
                              isTrusted: !device.is_trusted,
                            })
                          }
                        >
                          {device.is_trusted ? "Desconfiar" : "Confiar"}
                        </Button>
                      )}
                      {!isCurrentDevice && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeviceToRemove(device.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum dispositivo registrado
            </p>
          )}
        </section>

        <Separator />

        {/* Security Alerts Section */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Alertas de Segurança</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifyNewDevice">Notificar login em novo dispositivo</Label>
                <p className="text-xs text-muted-foreground">
                  Receba uma notificação quando alguém acessar sua conta de um novo dispositivo
                </p>
              </div>
              <Switch
                id="notifyNewDevice"
                checked={notifyNewDevice}
                onCheckedChange={handleNotifyNewDeviceChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifySecurityEvents">Notificar eventos de segurança</Label>
                <p className="text-xs text-muted-foreground">
                  Receba notificações sobre alterações de senha e outras atividades de segurança
                </p>
              </div>
              <Switch
                id="notifySecurityEvents"
                checked={notifySecurityEvents}
                onCheckedChange={handleNotifySecurityEventsChange}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Remove Device Dialog */}
      <AlertDialog open={!!deviceToRemove} onOpenChange={() => setDeviceToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover dispositivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Este dispositivo será removido da sua lista. Se for um dispositivo em uso, ele será
              desconectado da sua conta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deviceToRemove && removeDevice.mutate(deviceToRemove)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enable 2FA Dialog */}
      <Dialog open={showEnableTwoFactorDialog} onOpenChange={setShowEnableTwoFactorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Ativar Verificação em Duas Etapas
            </DialogTitle>
            <DialogDescription>
              Digite o código de 6 dígitos que enviamos para seu email para confirmar a ativação.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <TwoFactorInput
              onComplete={handleVerify2FACode}
              onResend={handleResend2FACode}
              isVerifying={isVerifying2FA}
              isResending={isResending2FA}
              maskedEmail={maskedEmail}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Security;
