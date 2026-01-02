import { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTeams } from "@/hooks/useTeams";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ArrowLeft, Shield, Globe, MapPin } from "lucide-react";
import type { Team } from "@/hooks/useTeams";

// Componente separado para o card do time com estado próprio para controlar erro de imagem
const TeamCard = memo(({ team }: { team: Team }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden border border-border shadow-sm">
        {team.escudo_url && !imageError ? (
          <img
            src={team.escudo_url}
            alt={team.nome}
            className="w-12 h-12 object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <Shield className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      <span className="text-xs text-center font-medium line-clamp-2 leading-tight">
        {team.nome}
      </span>
    </div>
  );
});

const Teams = () => {
  const navigate = useNavigate();
  const [selectedPaisId, setSelectedPaisId] = useState<number | null>(26); // Default Brasil
  const [selectedEstadoId, setSelectedEstadoId] = useState<number | null>(17); // Default Pernambuco
  const [search, setSearch] = useState("");

  // Fetch countries
  const { data: paises, isLoading: paisesLoading } = useQuery({
    queryKey: ["paises"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paises")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Fetch states filtered by country with team counts
  const { data: estados, isLoading: estadosLoading } = useQuery({
    queryKey: ["estados-with-counts", selectedPaisId],
    queryFn: async () => {
      if (!selectedPaisId) return [];
      
      // Fetch states
      const { data: estadosData, error: estadosError } = await supabase
        .from("estados")
        .select("*")
        .eq("pais_id", selectedPaisId)
        .order("nome");
      if (estadosError) throw estadosError;
      
      // Fetch teams to count per state
      const { data: teamsData, error: teamsError } = await supabase
        .from("times")
        .select("estado_id")
        .eq("pais_id", selectedPaisId);
      if (teamsError) throw teamsError;
      
      // Count teams per state
      const teamCounts = teamsData?.reduce((acc, team) => {
        if (team.estado_id) {
          acc[team.estado_id] = (acc[team.estado_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<number, number>) || {};
      
      // Add count to each state
      return estadosData?.map(estado => ({
        ...estado,
        teamCount: teamCounts[estado.id] || 0
      })) || [];
    },
    enabled: !!selectedPaisId,
  });

  // Fetch teams
  const { data: teams, isLoading: teamsLoading } = useTeams({
    estadoId: selectedEstadoId || undefined,
    paisId: selectedPaisId || undefined,
    search: search.trim() || undefined,
  });

  const selectedPais = paises?.find((p) => p.id === selectedPaisId);
  const selectedEstado = estados?.find((e) => e.id === selectedEstadoId);

  const handlePaisChange = (value: string) => {
    const paisId = parseInt(value);
    setSelectedPaisId(paisId);
    setSelectedEstadoId(null); // Reset state when country changes
  };

  const handleEstadoChange = (value: string) => {
    setSelectedEstadoId(parseInt(value));
  };

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
            <h1 className="text-lg font-semibold">Times</h1>
            <p className="text-xs text-muted-foreground">
              {teamsLoading ? "Carregando..." : `${teams?.length || 0} times`}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3 space-y-3">
          {/* Country Selector */}
          <Select
            value={selectedPaisId?.toString() || ""}
            onValueChange={handlePaisChange}
          >
            <SelectTrigger className="w-full bg-muted/50 border-0">
              <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Selecione o país" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              {paisesLoading ? (
                <div className="p-2">
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                paises?.map((pais) => (
                  <SelectItem key={pais.id} value={pais.id.toString()}>
                    <div className="flex items-center gap-2">
                      {pais.bandeira_url && (
                        <img
                          src={pais.bandeira_url}
                          alt={pais.nome}
                          className="w-5 h-4 object-cover rounded-sm"
                        />
                      )}
                      {pais.nome}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {/* State Selector */}
          <Select
            value={selectedEstadoId?.toString() || ""}
            onValueChange={handleEstadoChange}
            disabled={!selectedPaisId}
          >
            <SelectTrigger className="w-full bg-muted/50 border-0">
              <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50 max-h-60">
              {estadosLoading ? (
                <div className="p-2">
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : estados && estados.length > 0 ? (
                estados.map((estado) => (
                  <SelectItem key={estado.id} value={estado.id.toString()}>
                    <div className="flex items-center gap-2 w-full">
                      {estado.bandeira_url && (
                        <img
                          src={estado.bandeira_url}
                          alt={estado.nome}
                          className="w-5 h-4 object-cover rounded-sm"
                        />
                      )}
                      <span className="flex-1">{estado.nome}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {estado.teamCount} {estado.teamCount === 1 ? 'time' : 'times'}
                      </span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  Nenhum estado encontrado
                </div>
              )}
            </SelectContent>
          </Select>

          {/* Search */}
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
        {teamsLoading ? (
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
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Shield className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {search ? "Nenhum time encontrado" : "Selecione um país e estado para ver os times"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Teams;
