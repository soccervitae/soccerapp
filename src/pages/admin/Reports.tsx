import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Check, X, Eye, Ban, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewReportedPostSheet } from "@/components/admin/ViewReportedPostSheet";
import { ViewReportedProfileSheet } from "@/components/admin/ViewReportedProfileSheet";

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

export default function AdminReports() {
  const [tab, setTab] = useState("posts");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedProfileReport, setSelectedProfileReport] = useState<any>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [viewProfileSheetOpen, setViewProfileSheetOpen] = useState(false);
  const [postStatusFilter, setPostStatusFilter] = useState<string>("all");
  const [profileStatusFilter, setProfileStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: postReports, isLoading: loadingPostReports } = useQuery({
    queryKey: ["adminPostReports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select(`
          *,
          reporter:reporter_id(username, avatar_url),
          post:post_id(
            id,
            content, 
            user_id, 
            media_url,
            media_type,
            location_name,
            likes_count,
            comments_count,
            shares_count,
            created_at,
            profiles:user_id(username, avatar_url)
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: profileReports, isLoading: loadingProfileReports } = useQuery({
    queryKey: ["adminProfileReports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_reports")
        .select(`
          *,
          reporter:profiles!profile_reports_reporter_id_fkey(username, avatar_url),
          profile:profiles!profile_reports_profile_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            bio,
            created_at,
            banned_at,
            ban_reason,
            conta_verificada,
            is_official_account
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      type,
    }: {
      id: string;
      status: string;
      type: "post" | "profile";
    }) => {
      const table = type === "post" ? "reports" : "profile_reports";
      const { error } = await supabase
        .from(table)
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPostReports"] });
      queryClient.invalidateQueries({ queryKey: ["adminProfileReports"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      toast.success("Status atualizado");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPostReports"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post excluído com sucesso");
      setViewSheetOpen(false);
    },
    onError: () => {
      toast.error("Erro ao excluir post");
    },
  });

  const banProfileMutation = useMutation({
    mutationFn: async ({ profileId, reason }: { profileId: string; reason: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          banned_at: new Date().toISOString(),
          ban_reason: reason 
        })
        .eq("id", profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProfileReports"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      toast.success("Conta banida com sucesso");
      setViewProfileSheetOpen(false);
    },
    onError: () => {
      toast.error("Erro ao banir conta");
    },
  });

  const unbanProfileMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          banned_at: null,
          ban_reason: null 
        })
        .eq("id", profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProfileReports"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      toast.success("Banimento removido");
      setViewProfileSheetOpen(false);
    },
    onError: () => {
      toast.error("Erro ao remover banimento");
    },
  });

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setViewSheetOpen(true);
  };

  const handleViewProfileReport = (report: any) => {
    setSelectedProfileReport(report);
    setViewProfileSheetOpen(true);
  };

  const handleResolve = () => {
    if (selectedReport) {
      updateReportMutation.mutate({
        id: selectedReport.id,
        status: "resolved",
        type: "post",
      });
    }
  };

  const handleReject = () => {
    if (selectedReport) {
      updateReportMutation.mutate({
        id: selectedReport.id,
        status: "rejected",
        type: "post",
      });
    }
  };

  const handleDeletePost = () => {
    if (selectedReport?.post?.id) {
      deletePostMutation.mutate(selectedReport.post.id);
    }
  };

  const handleProfileResolve = () => {
    if (selectedProfileReport) {
      updateReportMutation.mutate({
        id: selectedProfileReport.id,
        status: "resolved",
        type: "profile",
      });
    }
  };

  const handleProfileReject = () => {
    if (selectedProfileReport) {
      updateReportMutation.mutate({
        id: selectedProfileReport.id,
        status: "rejected",
        type: "profile",
      });
    }
  };

  const handleBanProfile = (reason: string) => {
    if (selectedProfileReport?.profile?.id) {
      banProfileMutation.mutate({ 
        profileId: selectedProfileReport.profile.id, 
        reason 
      });
    }
  };

  const handleUnbanProfile = () => {
    if (selectedProfileReport?.profile?.id) {
      unbanProfileMutation.mutate(selectedProfileReport.profile.id);
    }
  };

  // Filter reports based on selected status
  const filteredPostReports = postReports?.filter(
    (report) => postStatusFilter === "all" || report.status === postStatusFilter
  );
  
  const filteredProfileReports = profileReports?.filter(
    (report) => profileStatusFilter === "all" || report.status === profileStatusFilter
  );

  const renderPostReports = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Denunciante</TableHead>
          <TableHead>Autor do Post</TableHead>
          <TableHead>Conteúdo</TableHead>
          <TableHead>Mídia</TableHead>
          <TableHead>Motivo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Data</TableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loadingPostReports ? (
          Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-10 w-32" /></TableCell>
              <TableCell><Skeleton className="h-10 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-48" /></TableCell>
              <TableCell><Skeleton className="h-12 w-12 rounded-md" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-6 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))
        ) : filteredPostReports?.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
              Nenhuma denúncia de post encontrada
            </TableCell>
          </TableRow>
        ) : (
          filteredPostReports?.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={report.reporter?.avatar_url || ""} />
                    <AvatarFallback>
                      {report.reporter?.username?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">@{report.reporter?.username}</span>
                </div>
              </TableCell>
              <TableCell>
                {report.post?.profiles ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={report.post.profiles.avatar_url || ""} />
                      <AvatarFallback>
                        {report.post.profiles.username?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">@{report.post.profiles.username}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <p className="text-sm line-clamp-2 max-w-[200px]">
                  {report.post?.content || "Post deletado"}
                </p>
              </TableCell>
              <TableCell>
                {report.post?.media_url ? (
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {report.post?.media_type === "video" ? (
                      <video 
                        src={report.post.media_url} 
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <img 
                        src={report.post.media_url} 
                        alt="Post media"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell className="text-sm">{report.reason}</TableCell>
              <TableCell>
                <Badge variant="outline" className={statusColors[report.status]}>
                  {statusLabels[report.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(report.created_at), "dd MMM yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewReport(report)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        updateReportMutation.mutate({
                          id: report.id,
                          status: "resolved",
                          type: "post",
                        })
                      }
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Marcar como resolvida
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        updateReportMutation.mutate({
                          id: report.id,
                          status: "rejected",
                          type: "post",
                        })
                      }
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rejeitar denúncia
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  const renderProfileReports = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Denunciante</TableHead>
          <TableHead>Perfil Denunciado</TableHead>
          <TableHead>Motivo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Data</TableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loadingProfileReports ? (
          Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-10 w-32" /></TableCell>
              <TableCell><Skeleton className="h-10 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-6 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))
        ) : filteredProfileReports?.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              Nenhuma denúncia de perfil encontrada
            </TableCell>
          </TableRow>
        ) : (
          filteredProfileReports?.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                {report.reporter ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={report.reporter?.avatar_url || ""} />
                      <AvatarFallback>
                        {report.reporter?.username?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">@{report.reporter?.username}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    ID: {report.reporter_id.slice(0, 8)}...
                  </span>
                )}
              </TableCell>
              <TableCell>
                {report.profile ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={report.profile?.avatar_url || ""} />
                      <AvatarFallback>
                        {report.profile?.username?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-sm">@{report.profile?.username}</span>
                      {report.profile?.banned_at && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          <Ban className="h-3 w-3 mr-1" />
                          Banido
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    ID: {report.profile_id.slice(0, 8)}...
                  </span>
                )}
              </TableCell>
              <TableCell className="text-sm">{report.reason}</TableCell>
              <TableCell>
                <Badge variant="outline" className={statusColors[report.status]}>
                  {statusLabels[report.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(report.created_at), "dd MMM yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewProfileReport(report)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        updateReportMutation.mutate({
                          id: report.id,
                          status: "resolved",
                          type: "profile",
                        })
                      }
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Marcar como resolvida
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        updateReportMutation.mutate({
                          id: report.id,
                          status: "rejected",
                          type: "profile",
                        })
                      }
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rejeitar denúncia
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Denúncias</h1>
          <p className="text-muted-foreground">
            Gerencie denúncias de posts e perfis
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="posts">
              Posts ({postReports?.filter((r) => r.status === "pending").length || 0})
            </TabsTrigger>
            <TabsTrigger value="profiles">
              Perfis ({profileReports?.filter((r) => r.status === "pending").length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={postStatusFilter} onValueChange={setPostStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="resolved">Resolvida</SelectItem>
                  <SelectItem value="rejected">Rejeitada</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {filteredPostReports?.length || 0} denúncia(s)
              </span>
            </div>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {renderPostReports()}
            </div>
          </TabsContent>

          <TabsContent value="profiles" className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={profileStatusFilter} onValueChange={setProfileStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="resolved">Resolvida</SelectItem>
                  <SelectItem value="rejected">Rejeitada</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {filteredProfileReports?.length || 0} denúncia(s)
              </span>
            </div>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {renderProfileReports()}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ViewReportedPostSheet
        open={viewSheetOpen}
        onOpenChange={setViewSheetOpen}
        report={selectedReport}
        onResolve={handleResolve}
        onReject={handleReject}
        onDeletePost={handleDeletePost}
        isDeleting={deletePostMutation.isPending}
      />

      <ViewReportedProfileSheet
        open={viewProfileSheetOpen}
        onOpenChange={setViewProfileSheetOpen}
        report={selectedProfileReport}
        onResolve={handleProfileResolve}
        onReject={handleProfileReject}
        onBanProfile={handleBanProfile}
        onUnbanProfile={handleUnbanProfile}
        isBanning={banProfileMutation.isPending || unbanProfileMutation.isPending}
      />
    </AdminLayout>
  );
}
