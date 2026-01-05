import { useState, useEffect, useMemo } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ExploreFilters {
  profileType?: number | null;
  gender?: string | null;
  birthYear?: number | null;
  countryId?: number | null;
  position?: number | null;
}

interface ExploreFiltersSheetProps {
  filters: ExploreFilters;
  onFiltersChange: (filters: ExploreFilters) => void;
  hasActiveFilters: boolean;
}

const ExploreFiltersSheet = ({
  filters,
  onFiltersChange,
  hasActiveFilters,
}: ExploreFiltersSheetProps) => {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<ExploreFilters>(filters);

  // Sync local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Fetch profile types
  const { data: profileTypes } = useQuery({
    queryKey: ["profile-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funcaoperfil")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Find "Atleta" profile type ID
  const atletaTypeId = useMemo(() => {
    return profileTypes?.find((t) => t.name.toLowerCase() === "atleta")?.id;
  }, [profileTypes]);

  const isAtletaSelected = localFilters.profileType === atletaTypeId;

  // Fetch male positions
  const { data: malePositions } = useQuery({
    queryKey: ["male-positions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posicao_masculina")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: isAtletaSelected,
  });

  // Fetch female positions
  const { data: femalePositions } = useQuery({
    queryKey: ["female-positions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posicao_feminina")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: isAtletaSelected,
  });

  // Determine which positions to show based on gender
  const positions = useMemo(() => {
    if (localFilters.gender === "masculino") {
      return malePositions || [];
    } else if (localFilters.gender === "feminino") {
      return femalePositions || [];
    }
    // If no gender selected, combine both (showing unique names)
    const allPositions = [...(malePositions || []), ...(femalePositions || [])];
    const uniqueNames = new Map<string, { id: number; name: string }>();
    allPositions.forEach((p) => {
      if (!uniqueNames.has(p.name)) {
        uniqueNames.set(p.name, p);
      }
    });
    return Array.from(uniqueNames.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [localFilters.gender, malePositions, femalePositions]);

  // Fetch countries
  const { data: countries } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paises")
        .select("id, nome, bandeira_url")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Generate year options (last 50 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - 16 - i);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleClearFilters = () => {
    const emptyFilters: ExploreFilters = {
      profileType: null,
      gender: null,
      birthYear: null,
      countryId: null,
      position: null,
    };
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    setOpen(false);
  };

  // Clear position when profile type changes away from Atleta
  const handleProfileTypeChange = (value: string) => {
    const newProfileType = value === "all" ? null : Number(value);
    const newAtletaSelected = newProfileType === atletaTypeId;
    
    setLocalFilters({
      ...localFilters,
      profileType: newProfileType,
      // Clear position if not Atleta
      position: newAtletaSelected ? localFilters.position : null,
    });
  };

  const hasLocalFilters =
    localFilters.profileType ||
    localFilters.gender ||
    localFilters.birthYear ||
    localFilters.countryId ||
    localFilters.position;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Filter className="w-5 h-5" />
          {hasActiveFilters && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-3xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg font-semibold">Filtros</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pb-6">
          {/* Profile Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Tipo de Perfil
            </label>
            <Select
              value={localFilters.profileType?.toString() || "all"}
              onValueChange={handleProfileTypeChange}
            >
              <SelectTrigger className="w-full bg-muted/50">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="all">Todos</SelectItem>
                {profileTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Sexo</label>
            <Select
              value={localFilters.gender || "all"}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  gender: value === "all" ? null : value,
                  // Clear position when gender changes (positions differ by gender)
                  position: null,
                })
              }
            >
              <SelectTrigger className="w-full bg-muted/50">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Position - Only show when Atleta is selected */}
          {isAtletaSelected && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Posição
              </label>
              <Select
                value={localFilters.position?.toString() || "all"}
                onValueChange={(value) =>
                  setLocalFilters({
                    ...localFilters,
                    position: value === "all" ? null : Number(value),
                  })
                }
              >
                <SelectTrigger className="w-full bg-muted/50">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50 max-h-60">
                  <SelectItem value="all">Todas</SelectItem>
                  {positions.map((pos) => (
                    <SelectItem key={pos.id} value={pos.id.toString()}>
                      {pos.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Birth Year */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Ano de Nascimento
            </label>
            <Select
              value={localFilters.birthYear?.toString() || "all"}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  birthYear: value === "all" ? null : Number(value),
                })
              }
            >
              <SelectTrigger className="w-full bg-muted/50">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50 max-h-60">
                <SelectItem value="all">Todos</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Country */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">País</label>
            <Select
              value={localFilters.countryId?.toString() || "all"}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  countryId: value === "all" ? null : Number(value),
                })
              }
            >
              <SelectTrigger className="w-full bg-muted/50">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50 max-h-60">
                <SelectItem value="all">Todos</SelectItem>
                {countries?.map((country) => (
                  <SelectItem key={country.id} value={country.id.toString()}>
                    <div className="flex items-center gap-2">
                      {country.bandeira_url && (
                        <img
                          src={country.bandeira_url}
                          alt={country.nome}
                          className="w-5 h-3.5 object-cover rounded-sm"
                        />
                      )}
                      {country.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-border">
          {hasLocalFilters && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          )}
          <Button onClick={handleApplyFilters} className="flex-1">
            Aplicar Filtros
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ExploreFiltersSheet;
