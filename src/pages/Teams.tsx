import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTeams } from "@/hooks/useTeams";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowLeft, Shield } from "lucide-react";

const Teams = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const estadoId = searchParams.get("estado") ? parseInt(searchParams.get("estado")!) : 17; // Default Pernambuco
  const paisId = searchParams.get("pais") ? parseInt(searchParams.get("pais")!) : 26; // Default Brasil
  
  const [search, setSearch] = useState("");
  
  const { data: teams, isLoading } = useTeams({
    estadoId,
    paisId,
    search: search.trim() || undefined,
  });

  const estadoName = teams?.[0]?.estado?.nome || "Pernambuco";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Times de {estadoName}</h1>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Carregando..." : `${teams?.length || 0} times`}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar time..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/50 border-0"
            />
          </div>
        </div>
      </header>

      {/* Teams Grid */}
      <main className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="w-16 h-16 rounded-full" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>
        ) : teams && teams.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
                  {team.escudo_url ? (
                    <img
                      src={team.escudo_url}
                      alt={team.nome}
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement?.querySelector(".fallback-icon")?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <Shield className={`w-8 h-8 text-muted-foreground fallback-icon ${team.escudo_url ? "hidden" : ""}`} />
                </div>
                <span className="text-xs text-center font-medium line-clamp-2 leading-tight">
                  {team.nome}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Shield className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {search ? "Nenhum time encontrado" : "Nenhum time cadastrado"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Teams;
