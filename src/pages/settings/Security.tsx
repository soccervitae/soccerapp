import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2, Monitor, Smartphone, Tablet, Shield, Trash2, ShieldCheck, RefreshCw, LogOut, AlertTriangle } from "lucide-react";
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
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveAlertModal,
} from "@/components/ui/responsive-modal";

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

  // Session management state
  const [showSignOutOthersConfirm, setShowSignOutOthersConfirm] = useState(false);
  const [showSignOutAllConfirm, setShowSignOutAllConfirm] = useState(false);
  const [isSigningOutOthers, setIsSigningOutOthers] = useState(false);
  const [isSigningOutAll, setIsSigningOutAll] = useState(false);

  // Delete account state
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [showDeleteAccountEmailVerify, setShowDeleteAccountEmailVerify] = useState(false);
  const [showDeleteAccountFinalConfirm, setShowDeleteAccountFinalConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isSendingDeleteCode, setIsSendingDeleteCode] = useState(false);
  const [isVerifyingDeleteCode, setIsVerifyingDeleteCode] = useState(false);
  const [isResendingDeleteCode, setIsResendingDeleteCode] = useState(false);
  const [deleteMaskedEmail, setDeleteMaskedEmail] = useState("");
  const [showCancelDeletionConfirm, setShowCancelDeletionConfirm] = useState(false);
  const [isCancelingDeletion, setIsCancelingDeletion] = useState(false);
  const [scheduledDeletionAt, setScheduledDeletionAt] = useState<string | null>(null);

  // Load current device fingerprint
  useEffect(() => {
    const loadFingerprint = async () => {
      const fingerprint = await getCurrentDeviceFingerprint();
      setCurrentFingerprint(fingerprint);
    };
    loadFingerprint();
  }, []);

  // Fetch user profile for security settings
  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["profile-security", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("notify_new_device, notify_security_events, two_factor_enabled, scheduled_deletion_at")
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
      setScheduledDeletionAt(profile.scheduled_deletion_at ?? null);
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

  // Sign out from other sessions (keep current)
  const handleSignOutOthers = async () => {
    setIsSigningOutOthers(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) throw error;

      // Also remove other devices from the list
      if (user?.id && currentFingerprint) {
        await supabase
          .from("user_devices")
          .delete()
          .eq("user_id", user.id)
          .neq("device_fingerprint", currentFingerprint);
      }

      queryClient.invalidateQueries({ queryKey: ["user-devices"] });
      toast({ title: "Todas as outras sessões foram encerradas" });
      setShowSignOutOthersConfirm(false);
    } catch (error) {
      console.error("Error signing out others:", error);
      toast({ variant: "destructive", title: "Erro ao encerrar sessões" });
    }
    setIsSigningOutOthers(false);
  };

  // Sign out from ALL sessions (including current)
  const handleSignOutAll = async () => {
    setIsSigningOutAll(true);
    try {
      // Remove all devices for this user
      if (user?.id) {
        await supabase
          .from("user_devices")
          .delete()
          .eq("user_id", user.id);
      }

      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;

      navigate("/auth");
    } catch (error) {
      console.error("Error signing out all:", error);
      toast({ variant: "destructive", title: "Erro ao encerrar sessões" });
      setIsSigningOutAll(false);
    }
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

  // Send delete account verification code
  const handleSendDeleteCode = async () => {
    if (!user?.email || !user?.id) return;
    setIsSendingDeleteCode(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-delete-account-code", {
        body: {
          email: user.email,
          user_id: user.id,
        },
      });

      if (error) throw error;

      setDeleteMaskedEmail(data?.masked_email || user.email);
      setShowDeleteAccountConfirm(false);
      setShowDeleteAccountEmailVerify(true);
    } catch (error) {
      console.error("Error sending delete code:", error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar código",
        description: "Não foi possível enviar o código de confirmação.",
      });
    }

    setIsSendingDeleteCode(false);
  };

  // Verify delete account code
  const handleVerifyDeleteCode = async (code: string) => {
    setIsVerifyingDeleteCode(true);

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
          description: "Solicite um novo código de confirmação.",
        });
        setIsVerifyingDeleteCode(false);
        return;
      }

      if (profileData.codigo !== code) {
        toast({
          variant: "destructive",
          title: "Código inválido",
          description: "O código informado não está correto.",
        });
        setIsVerifyingDeleteCode(false);
        return;
      }

      // Code verified, proceed to final confirmation
      setShowDeleteAccountEmailVerify(false);
      setShowDeleteAccountFinalConfirm(true);
    } catch (error) {
      console.error("Error verifying delete code:", error);
      toast({
        variant: "destructive",
        title: "Erro na verificação",
        description: "Ocorreu um erro ao verificar o código.",
      });
    }

    setIsVerifyingDeleteCode(false);
  };

  // Resend delete account code
  const handleResendDeleteCode = async () => {
    if (!user?.email || !user?.id) return;
    setIsResendingDeleteCode(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-delete-account-code", {
        body: {
          email: user.email,
          user_id: user.id,
        },
      });

      if (error) throw error;

      setDeleteMaskedEmail(data?.masked_email || user.email);
      toast({
        title: "Código reenviado!",
        description: "Verifique sua caixa de entrada.",
      });
    } catch (error) {
      console.error("Error resending delete code:", error);
      toast({
        variant: "destructive",
        title: "Erro ao reenviar",
        description: "Não foi possível reenviar o código.",
      });
    }

    setIsResendingDeleteCode(false);
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

        {/* Trusted Devices Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Dispositivos Confiáveis</h2>
          </div>

          <p className="text-xs text-muted-foreground">
            Dispositivos confiáveis podem fazer login sem verificação em duas etapas por 30 dias.
          </p>

          {loadingDevices ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (() => {
            const trustedDevices = devices?.filter((d) => {
              if (!d.is_trusted) return false;
              if (!d.trusted_until) return false;
              return new Date(d.trusted_until) > new Date();
            }) || [];

            if (trustedDevices.length === 0) {
              return (
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <ShieldCheck className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum dispositivo confiável no momento
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Marque "Lembrar deste dispositivo" ao fazer login
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {trustedDevices.map((device) => {
                  const isCurrentDevice = device.device_fingerprint === currentFingerprint;
                  const daysRemaining = Math.ceil(
                    (new Date(device.trusted_until!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div
                      key={device.id}
                      className={`p-4 rounded-lg border ${
                        isCurrentDevice 
                          ? "bg-primary/5 border-primary/30" 
                          : "bg-muted/30 border-border"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
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
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              daysRemaining <= 5 
                                ? "bg-destructive/10 text-destructive" 
                                : "bg-primary/10 text-primary"
                            }`}>
                              {daysRemaining} {daysRemaining === 1 ? "dia restante" : "dias restantes"}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Expira em {format(new Date(device.trusted_until!), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isCurrentDevice && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => renewDeviceTrust.mutate(device.id)}
                              disabled={renewDeviceTrust.isPending}
                              className="text-xs"
                            >
                              <RefreshCw className={`h-3 w-3 mr-1 ${renewDeviceTrust.isPending ? "animate-spin" : ""}`} />
                              Renovar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleDeviceTrust.mutate({
                                deviceId: device.id,
                                isTrusted: false,
                              })
                            }
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                          >
                            Revogar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
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

        <Separator />

        {/* Session Management Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Gerenciamento de Sessões</h2>
          </div>

          <div className="space-y-3">
            {/* Sign out other sessions */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="space-y-1">
                <p className="font-medium text-sm">Encerrar outras sessões</p>
                <p className="text-xs text-muted-foreground">
                  Encerra sessões em todos os outros dispositivos, mantendo apenas a sessão atual ativa.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowSignOutOthersConfirm(true)}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Encerrar outras sessões
              </Button>
            </div>

            {/* Sign out all sessions */}
            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium text-sm text-destructive">Encerrar todas as sessões</p>
                  <p className="text-xs text-muted-foreground">
                    Você será deslogado de TODOS os dispositivos, incluindo este. Precisará fazer login novamente.
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowSignOutAllConfirm(true)}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Encerrar todas as sessões
              </Button>
            </div>
          </div>
        </section>

        <Separator />

        {/* Delete Account Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <h2 className="text-base font-semibold text-destructive">Zona de Perigo</h2>
          </div>

          {scheduledDeletionAt ? (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium text-sm text-destructive">Exclusão agendada</p>
                  <p className="text-xs text-muted-foreground">
                    Sua conta será permanentemente excluída em{" "}
                    <strong className="text-foreground">
                      {format(new Date(scheduledDeletionAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </strong>.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Se você mudar de ideia, pode cancelar a exclusão abaixo. Após a data, a exclusão será irreversível.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary/10"
                onClick={() => setShowCancelDeletionConfirm(true)}
              >
                Cancelar exclusão da conta
              </Button>
            </div>
          ) : (
            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium text-sm text-destructive">Deletar conta</p>
                  <p className="text-xs text-muted-foreground">
                    Ao solicitar a exclusão, sua conta será agendada para exclusão em 7 dias. Durante este período, você pode cancelar a exclusão e recuperar sua conta.
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowDeleteAccountConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar minha conta
              </Button>
            </div>
          )}
        </section>
      </div>

      {/* Remove Device Modal - Responsive */}
      <ResponsiveAlertModal
        open={!!deviceToRemove}
        onOpenChange={() => setDeviceToRemove(null)}
        title="Remover dispositivo?"
        description="Este dispositivo será removido da sua lista. Se for um dispositivo em uso, ele será desconectado da sua conta."
        cancelText="Cancelar"
        confirmText="Remover"
        onConfirm={() => deviceToRemove && removeDevice.mutate(deviceToRemove)}
        confirmVariant="destructive"
      />

      {/* Enable 2FA Modal - Responsive */}
      <ResponsiveModal open={showEnableTwoFactorDialog} onOpenChange={setShowEnableTwoFactorDialog}>
        <ResponsiveModalContent className="sm:max-w-md">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Ativar Verificação em Duas Etapas
            </ResponsiveModalTitle>
            <ResponsiveModalDescription>
              Digite o código de 6 dígitos que enviamos para seu email para confirmar a ativação.
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>
          <div className="py-4">
            <TwoFactorInput
              onComplete={handleVerify2FACode}
              onResend={handleResend2FACode}
              isVerifying={isVerifying2FA}
              isResending={isResending2FA}
              maskedEmail={maskedEmail}
            />
          </div>
        </ResponsiveModalContent>
      </ResponsiveModal>

      {/* Sign Out Others Confirmation Modal */}
      <ResponsiveAlertModal
        open={showSignOutOthersConfirm}
        onOpenChange={setShowSignOutOthersConfirm}
        title="Encerrar outras sessões?"
        description="Todos os outros dispositivos serão desconectados da sua conta. Apenas este dispositivo permanecerá logado."
        cancelText="Cancelar"
        confirmText={isSigningOutOthers ? "Encerrando..." : "Encerrar"}
        onConfirm={handleSignOutOthers}
        confirmVariant="default"
      />

      {/* Sign Out All Confirmation Modal */}
      <ResponsiveAlertModal
        open={showSignOutAllConfirm}
        onOpenChange={setShowSignOutAllConfirm}
        title="Encerrar TODAS as sessões?"
        description="Você será deslogado de TODOS os dispositivos, incluindo este. Precisará fazer login novamente para acessar sua conta."
        cancelText="Cancelar"
        confirmText={isSigningOutAll ? "Encerrando..." : "Encerrar tudo"}
        onConfirm={handleSignOutAll}
        confirmVariant="destructive"
      />

      {/* Delete Account First Confirmation */}
      <ResponsiveAlertModal
        open={showDeleteAccountConfirm}
        onOpenChange={setShowDeleteAccountConfirm}
        title="Agendar exclusão da conta?"
        description="Sua conta será agendada para exclusão permanente em 7 dias. Durante este período, você poderá cancelar a exclusão e recuperar sua conta. Após os 7 dias, a exclusão será irreversível. Para sua segurança, enviaremos um código de confirmação para seu email."
        cancelText="Cancelar"
        confirmText={isSendingDeleteCode ? "Enviando..." : "Enviar código"}
        onConfirm={handleSendDeleteCode}
        confirmVariant="destructive"
      />

      {/* Delete Account Email Verification Modal */}
      <ResponsiveModal open={showDeleteAccountEmailVerify} onOpenChange={(open) => {
        setShowDeleteAccountEmailVerify(open);
      }}>
        <ResponsiveModalContent className="sm:max-w-md">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirme sua identidade
            </ResponsiveModalTitle>
            <ResponsiveModalDescription>
              Digite o código de 6 dígitos que enviamos para seu email para continuar com a exclusão da conta.
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>
          <div className="py-4">
            <TwoFactorInput
              onComplete={handleVerifyDeleteCode}
              onResend={handleResendDeleteCode}
              isVerifying={isVerifyingDeleteCode}
              isResending={isResendingDeleteCode}
              maskedEmail={deleteMaskedEmail}
            />
          </div>
        </ResponsiveModalContent>
      </ResponsiveModal>

      {/* Delete Account Final Confirmation Modal */}
      <ResponsiveModal open={showDeleteAccountFinalConfirm} onOpenChange={(open) => {
        setShowDeleteAccountFinalConfirm(open);
        if (!open) setDeleteConfirmText("");
      }}>
        <ResponsiveModalContent className="sm:max-w-md">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar agendamento de exclusão
            </ResponsiveModalTitle>
            <ResponsiveModalDescription>
              Para confirmar o agendamento da exclusão da sua conta, digite <strong className="text-foreground">DELETAR</strong> abaixo. Sua conta será excluída em 7 dias.
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>
          <div className="py-4 space-y-4">
            <Input
              placeholder="Digite DELETAR para confirmar"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
              className="text-center font-mono"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDeleteAccountFinalConfirm(false);
                  setDeleteConfirmText("");
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={deleteConfirmText !== "DELETAR" || isDeletingAccount}
                onClick={async () => {
                  setIsDeletingAccount(true);
                  try {
                    if (user?.id) {
                      // Schedule deletion for 7 days from now
                      const deletionDate = new Date();
                      deletionDate.setDate(deletionDate.getDate() + 7);
                      
                      const { error } = await supabase
                        .from("profiles")
                        .update({ 
                          scheduled_deletion_at: deletionDate.toISOString(),
                          codigo: null,
                          codigo_expira_em: null
                        })
                        .eq("id", user.id);
                      
                      if (error) throw error;
                      
                      setScheduledDeletionAt(deletionDate.toISOString());
                      setShowDeleteAccountFinalConfirm(false);
                      setDeleteConfirmText("");
                      refetchProfile();
                      
                      toast({
                        title: "Exclusão agendada",
                        description: `Sua conta será excluída em ${format(deletionDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}. Você pode cancelar a exclusão a qualquer momento.`,
                      });
                    }
                  } catch (error) {
                    console.error("Error scheduling account deletion:", error);
                    toast({
                      variant: "destructive",
                      title: "Erro ao agendar exclusão",
                      description: "Não foi possível agendar a exclusão. Tente novamente.",
                    });
                  }
                  setIsDeletingAccount(false);
                }}
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Agendando...
                  </>
                ) : (
                  "Agendar exclusão"
                )}
              </Button>
            </div>
          </div>
        </ResponsiveModalContent>
      </ResponsiveModal>

      {/* Cancel Deletion Confirmation Modal */}
      <ResponsiveAlertModal
        open={showCancelDeletionConfirm}
        onOpenChange={setShowCancelDeletionConfirm}
        title="Cancelar exclusão da conta?"
        description="Sua conta não será mais excluída e você poderá continuar usando normalmente."
        cancelText="Voltar"
        confirmText={isCancelingDeletion ? "Cancelando..." : "Sim, manter minha conta"}
        onConfirm={async () => {
          setIsCancelingDeletion(true);
          try {
            if (user?.id) {
              const { error } = await supabase
                .from("profiles")
                .update({ scheduled_deletion_at: null })
                .eq("id", user.id);
              
              if (error) throw error;
              
              setScheduledDeletionAt(null);
              setShowCancelDeletionConfirm(false);
              refetchProfile();
              
              toast({
                title: "Exclusão cancelada",
                description: "Sua conta não será mais excluída.",
              });
            }
          } catch (error) {
            console.error("Error canceling account deletion:", error);
            toast({
              variant: "destructive",
              title: "Erro ao cancelar exclusão",
              description: "Não foi possível cancelar a exclusão. Tente novamente.",
            });
          }
          setIsCancelingDeletion(false);
        }}
        confirmVariant="default"
      />
    </div>
  );
};

export default Security;
