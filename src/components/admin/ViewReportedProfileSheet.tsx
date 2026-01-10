import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveAlertModal,
} from "@/components/ui/responsive-modal";
import { 
  AlertTriangle, 
  Check, 
  X, 
  Ban, 
  Calendar, 
  User,
  FileText,
  Shield,
  Users,
  Image
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportedProfile {
  id: string;
  profile_id: string;
  reason: string;
  description?: string | null;
  status: string;
  created_at: string;
  reporter_id: string;
  reporter?: {
    username: string;
    avatar_url?: string;
  };
  profile?: {
    id: string;
    username: string;
    full_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    created_at: string;
    banned_at?: string | null;
    ban_reason?: string | null;
    conta_verificada?: boolean;
    is_official_account?: boolean;
  };
}

interface ViewReportedProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ReportedProfile | null;
  onResolve: () => void;
  onReject: () => void;
  onBanProfile: (reason: string) => void;
  onUnbanProfile: () => void;
  isBanning?: boolean;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  reviewing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  resolved: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  reviewing: "Em análise",
  resolved: "Resolvida",
  rejected: "Rejeitada",
};

export function ViewReportedProfileSheet({
  open,
  onOpenChange,
  report,
  onResolve,
  onReject,
  onBanProfile,
  onUnbanProfile,
  isBanning = false,
}: ViewReportedProfileSheetProps) {
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const [showUnbanConfirm, setShowUnbanConfirm] = useState(false);
  const [banReason, setBanReason] = useState("");

  if (!report) return null;

  const profile = report.profile;
  const isBanned = !!profile?.banned_at;

  const handleBanProfile = () => {
    onBanProfile(banReason || report.reason);
    setShowBanConfirm(false);
    setBanReason("");
  };

  const handleUnbanProfile = () => {
    onUnbanProfile();
    setShowUnbanConfirm(false);
  };

  return (
    <>
      <ResponsiveModal open={open} onOpenChange={onOpenChange}>
        <ResponsiveModalContent className="max-w-lg">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Denúncia de Perfil
            </ResponsiveModalTitle>
          </ResponsiveModalHeader>

          <div className="space-y-4 px-4 pb-4">
            {/* Report Info */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline" className={statusColors[report.status]}>
                  {statusLabels[report.status]}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Motivo</span>
                <span className="text-sm font-medium">{report.reason}</span>
              </div>
              {report.description && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Descrição</span>
                  <p className="text-sm bg-background p-2 rounded">{report.description}</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Denunciado por</span>
                <div className="flex items-center gap-2">
                  {report.reporter ? (
                    <>
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={report.reporter?.avatar_url || ""} />
                        <AvatarFallback className="text-xs">
                          {report.reporter?.username?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">@{report.reporter?.username}</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      ID: {report.reporter_id.slice(0, 8)}...
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Data</span>
                <span className="text-sm">
                  {format(new Date(report.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>

            <Separator />

            {/* Profile Content */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Perfil Denunciado</h4>
              
              {!profile ? (
                <div className="bg-muted/50 border border-border rounded-lg p-4 text-center">
                  <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Perfil não encontrado</p>
                </div>
              ) : (
                <div className="bg-card border rounded-lg p-4">
                  {/* Profile Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profile.avatar_url || ""} />
                      <AvatarFallback className="text-xl">
                        {profile.username?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">@{profile.username}</p>
                        {profile.conta_verificada && (
                          <Shield className="h-4 w-4 text-primary" />
                        )}
                        {profile.is_official_account && (
                          <Badge variant="secondary" className="text-xs">Oficial</Badge>
                        )}
                      </div>
                      {profile.full_name && (
                        <p className="text-sm text-muted-foreground">{profile.full_name}</p>
                      )}
                      {isBanned && (
                        <Badge variant="destructive" className="mt-1">
                          <Ban className="h-3 w-3 mr-1" />
                          Banido
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="space-y-3">
                    {profile.bio && (
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm">{profile.bio}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Membro desde {format(new Date(profile.created_at), "MMM yyyy", { locale: ptBR })}
                      </span>
                    </div>

                    {isBanned && profile.ban_reason && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mt-3">
                        <p className="text-sm text-destructive font-medium mb-1">Motivo do banimento:</p>
                        <p className="text-sm text-destructive/80">{profile.ban_reason}</p>
                        {profile.banned_at && (
                          <p className="text-xs text-destructive/60 mt-2">
                            Banido em {format(new Date(profile.banned_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Ações</h4>
              
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  className="justify-start h-11 border-green-500/30 text-green-600 hover:bg-green-500/10"
                  onClick={() => {
                    onResolve();
                    onOpenChange(false);
                  }}
                  disabled={report.status === "resolved"}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Marcar como resolvida
                </Button>
                
                <Button
                  variant="outline"
                  className="justify-start h-11 border-orange-500/30 text-orange-600 hover:bg-orange-500/10"
                  onClick={() => {
                    onReject();
                    onOpenChange(false);
                  }}
                  disabled={report.status === "rejected"}
                >
                  <X className="h-4 w-4 mr-2" />
                  Rejeitar denúncia
                </Button>
                
                {profile && !isBanned && (
                  <Button
                    variant="outline"
                    className="justify-start h-11 border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => setShowBanConfirm(true)}
                    disabled={isBanning}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    {isBanning ? "Banindo..." : "Banir conta"}
                  </Button>
                )}

                {profile && isBanned && (
                  <Button
                    variant="outline"
                    className="justify-start h-11 border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
                    onClick={() => setShowUnbanConfirm(true)}
                    disabled={isBanning}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {isBanning ? "Processando..." : "Remover banimento"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </ResponsiveModalContent>
      </ResponsiveModal>

      {/* Ban Confirmation Modal */}
      <ResponsiveModal open={showBanConfirm} onOpenChange={setShowBanConfirm}>
        <ResponsiveModalContent className="max-w-md">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle className="flex items-center gap-2 text-destructive">
              <Ban className="h-5 w-5" />
              Banir conta
            </ResponsiveModalTitle>
          </ResponsiveModalHeader>
          
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Você está prestes a banir a conta <strong>@{profile?.username}</strong>. 
              O usuário não poderá mais acessar a plataforma.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="ban-reason">Motivo do banimento</Label>
              <Textarea
                id="ban-reason"
                placeholder="Descreva o motivo do banimento..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowBanConfirm(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleBanProfile}>
                <Ban className="h-4 w-4 mr-2" />
                Confirmar banimento
              </Button>
            </div>
          </div>
        </ResponsiveModalContent>
      </ResponsiveModal>

      {/* Unban Confirmation Modal */}
      <ResponsiveAlertModal
        open={showUnbanConfirm}
        onOpenChange={setShowUnbanConfirm}
        title="Remover banimento?"
        description={`Você está prestes a remover o banimento da conta @${profile?.username}. O usuário poderá acessar a plataforma novamente.`}
        onConfirm={handleUnbanProfile}
        confirmText="Remover banimento"
        cancelText="Cancelar"
      />
    </>
  );
}
