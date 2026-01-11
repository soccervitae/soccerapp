import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ModerationStatus = "pending" | "flagged" | "approved" | "rejected";

interface Post {
  id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  moderation_status: ModerationStatus | null;
  moderation_reason: string | null;
  created_at: string;
  is_published: boolean | null;
}

export default function MyPosts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ModerationStatus | "all">("all");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["my-posts-moderation", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("posts")
        .select("id, content, media_url, media_type, moderation_status, moderation_reason, created_at, is_published")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Post[];
    },
    enabled: !!user?.id,
  });

  const filteredPosts = posts?.filter(post => {
    if (activeTab === "all") return true;
    return post.moderation_status === activeTab;
  }) || [];

  const getStatusCounts = () => {
    if (!posts) return { all: 0, pending: 0, flagged: 0, approved: 0, rejected: 0 };
    return {
      all: posts.length,
      pending: posts.filter(p => p.moderation_status === "pending").length,
      flagged: posts.filter(p => p.moderation_status === "flagged").length,
      approved: posts.filter(p => p.moderation_status === "approved").length,
      rejected: posts.filter(p => p.moderation_status === "rejected").length,
    };
  };

  const counts = getStatusCounts();

  const getStatusBadge = (status: ModerationStatus | null) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 border-amber-500/30">Em análise</Badge>;
      case "flagged":
        return <Badge variant="secondary" className="bg-orange-500/20 text-orange-600 border-orange-500/30">Aguardando revisão</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">Não moderado</Badge>;
    }
  };

  const getStatusIcon = (status: ModerationStatus | null) => {
    switch (status) {
      case "pending":
        return "hourglass_empty";
      case "flagged":
        return "flag";
      case "approved":
        return "check_circle";
      case "rejected":
        return "cancel";
      default:
        return "help";
    }
  };

  const getStatusDescription = (status: ModerationStatus | null, reason: string | null) => {
    switch (status) {
      case "pending":
        return "Seu post está sendo analisado automaticamente.";
      case "flagged":
        return reason || "Seu post foi marcado para revisão manual por um administrador.";
      case "approved":
        return "Seu post foi aprovado e está visível para todos.";
      case "rejected":
        return reason || "Seu post foi rejeitado por violar as diretrizes da comunidade.";
      default:
        return "Status de moderação não disponível.";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 h-14 flex items-center">
        <button 
          onClick={() => navigate('/settings')}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-foreground transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h1 className="text-base font-bold text-foreground ml-2">Meus Posts</h1>
      </header>

      <div className="pt-14 pb-20">
        {/* Info Card */}
        <div className="p-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-[24px]">info</span>
              <div>
                <p className="font-medium text-foreground text-sm">Sobre a moderação</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Todos os posts com mídia passam por análise automática. Posts marcados para revisão são analisados manualmente por nossa equipe.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ModerationStatus | "all")} className="px-4">
          <TabsList className="w-full grid grid-cols-5 h-auto p-1">
            <TabsTrigger value="all" className="text-xs py-2 px-1">
              Todos
              {counts.all > 0 && <span className="ml-1 text-[10px] opacity-70">({counts.all})</span>}
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs py-2 px-1">
              Análise
              {counts.pending > 0 && <span className="ml-1 text-[10px] opacity-70">({counts.pending})</span>}
            </TabsTrigger>
            <TabsTrigger value="flagged" className="text-xs py-2 px-1">
              Revisão
              {counts.flagged > 0 && <span className="ml-1 text-[10px] opacity-70">({counts.flagged})</span>}
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs py-2 px-1">
              Aprovados
              {counts.approved > 0 && <span className="ml-1 text-[10px] opacity-70">({counts.approved})</span>}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs py-2 px-1">
              Rejeitados
              {counts.rejected > 0 && <span className="ml-1 text-[10px] opacity-70">({counts.rejected})</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex gap-3">
                    <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                </div>
              ))
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-[48px] text-muted-foreground/50">article</span>
                <p className="text-muted-foreground mt-2">Nenhum post encontrado</p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div key={post.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex gap-3">
                    {/* Media Preview */}
                    {post.media_url && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        {post.media_type === "video" ? (
                          <video 
                            src={post.media_url} 
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <img 
                            src={post.media_url.split(",")[0]} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      {/* Status Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(post.moderation_status)}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(post.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      
                      {/* Content Preview */}
                      <p className="text-sm text-foreground line-clamp-2">
                        {post.content || "(Sem texto)"}
                      </p>
                      
                      {/* Status Description */}
                      <div className="flex items-start gap-2 mt-2 p-2 bg-muted/50 rounded-lg">
                        <span className={`material-symbols-outlined text-[18px] ${
                          post.moderation_status === "approved" ? "text-emerald-600" :
                          post.moderation_status === "rejected" ? "text-destructive" :
                          post.moderation_status === "flagged" ? "text-orange-600" :
                          "text-amber-600"
                        }`}>
                          {getStatusIcon(post.moderation_status)}
                        </span>
                        <p className="text-xs text-muted-foreground flex-1">
                          {getStatusDescription(post.moderation_status, post.moderation_reason)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
