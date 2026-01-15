import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatsCard } from "@/components/admin/StatsCard";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useAdminPageRefresh } from "@/hooks/useAdminPageRefresh";
import {
  Users,
  FileText,
  Flag,
  MessageSquare,
  Camera,
  TrendingUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { data: stats, isLoading, refetch } = useAdminStats();
  
  useAdminPageRefresh(refetch);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do Soccer Vitae
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatsCard
                title="Total de Usuários"
                value={stats?.totalUsers ?? 0}
                subtitle={`+${stats?.newUsersThisWeek ?? 0} esta semana`}
                icon={Users}
              />
              <StatsCard
                title="Total de Posts"
                value={stats?.totalPosts ?? 0}
                subtitle={`+${stats?.newPostsThisWeek ?? 0} esta semana`}
                icon={FileText}
              />
              <StatsCard
                title="Denúncias Pendentes"
                value={stats?.pendingReports ?? 0}
                subtitle="Aguardando análise"
                icon={Flag}
              />
              <StatsCard
                title="Stories Ativos"
                value={stats?.totalStories ?? 0}
                icon={Camera}
              />
              <StatsCard
                title="Mensagens Enviadas"
                value={stats?.totalMessages ?? 0}
                icon={MessageSquare}
              />
              <StatsCard
                title="Engajamento"
                value="--"
                subtitle="Em desenvolvimento"
                icon={TrendingUp}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">
                  Atividade Recente
                </h3>
                <p className="text-muted-foreground text-sm">
                  Gráfico de atividade em desenvolvimento...
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">
                  Usuários por Região
                </h3>
                <p className="text-muted-foreground text-sm">
                  Mapa de usuários em desenvolvimento...
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
