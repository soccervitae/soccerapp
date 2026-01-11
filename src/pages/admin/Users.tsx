import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MoreHorizontal, Shield, Eye, Ban, UserX, ChevronLeft, ChevronRight, Filter, X, Users, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { ViewUserSheet } from "@/components/admin/ViewUserSheet";

const ITEMS_PER_PAGE = 20;

type UserFilter = "all" | "admin" | "verified" | "unverified" | "banned";

interface FilterState {
  status: UserFilter;
  gender: string;
  profileType: string;
  country: string;
  state: string;
}

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    gender: "all",
    profileType: "all",
    country: "all",
    state: "all",
  });
  const queryClient = useQueryClient();

  // Fetch all admin user IDs for filtering
  const { data: adminUserIds } = useQuery({
    queryKey: ["adminUserIds"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      return data?.map(r => r.user_id) || [];
    },
  });

  // Fetch profile types
  const { data: profileTypes } = useQuery({
    queryKey: ["profileTypes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("funcaoperfil")
        .select("id, name")
        .order("name");
      return data || [];
    },
  });

  // Fetch countries
  const { data: countries } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const { data } = await supabase
        .from("paises")
        .select("id, nome")
        .order("nome");
      return data || [];
    },
  });

  // Fetch states based on selected country
  const { data: states } = useQuery({
    queryKey: ["states", filters.country],
    queryFn: async () => {
      if (filters.country === "all") return [];
      const { data } = await supabase
        .from("estados")
        .select("id, nome")
        .eq("pais_id", parseInt(filters.country))
        .order("nome");
      return data || [];
    },
    enabled: filters.country !== "all",
  });

  // Build filter query helper
  const applyFilters = (query: any) => {
    if (search) {
      query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Status filter
    if (filters.status === "banned") {
      query = query.not("banned_at", "is", null);
    } else if (filters.status === "verified") {
      query = query.eq("conta_verificada", true).is("banned_at", null);
    } else if (filters.status === "unverified") {
      query = query.eq("conta_verificada", false).is("banned_at", null);
    } else if (filters.status === "admin" && adminUserIds && adminUserIds.length > 0) {
      query = query.in("id", adminUserIds);
    }

    // Gender filter
    if (filters.gender !== "all") {
      query = query.eq("gender", filters.gender);
    }

    // Profile type filter (funcao column references funcaoperfil)
    if (filters.profileType !== "all") {
      query = query.eq("funcao", parseInt(filters.profileType));
    }

    // Country filter
    if (filters.country !== "all") {
      query = query.eq("nationality", parseInt(filters.country));
    }

    // State filter
    if (filters.state !== "all") {
      query = query.eq("estado_id", parseInt(filters.state));
    }

    return query;
  };

  // Query for total count with filters
  const { data: totalCount } = useQuery({
    queryKey: ["adminUsersCount", search, filters, adminUserIds],
    queryFn: async () => {
      if (filters.status === "admin" && (!adminUserIds || adminUserIds.length === 0)) {
        return 0;
      }

      let query = supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });

      query = applyFilters(query);

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    enabled: filters.status !== "admin" || adminUserIds !== undefined,
  });

  // Query for filter counts (statistics)
  const { data: filterStats } = useQuery({
    queryKey: ["adminUsersStats", adminUserIds],
    queryFn: async () => {
      const [
        totalResult,
        maleResult,
        femaleResult,
        bannedResult,
        verifiedResult,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("gender", "homem"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("gender", "mulher"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).not("banned_at", "is", null),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("conta_verificada", true),
      ]);

      return {
        total: totalResult.count || 0,
        male: maleResult.count || 0,
        female: femaleResult.count || 0,
        banned: bannedResult.count || 0,
        verified: verifiedResult.count || 0,
        admins: adminUserIds?.length || 0,
      };
    },
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["adminUsers", search, currentPage, filters, adminUserIds],
    queryFn: async () => {
      if (filters.status === "admin" && (!adminUserIds || adminUserIds.length === 0)) {
        return [];
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      query = applyFilters(query);
      query = query.range(from, to);

      const { data: profiles, error } = await query;
      if (error) throw error;
      
      // Fetch roles separately for all users
      if (profiles && profiles.length > 0) {
        const userIds = profiles.map(p => p.id);
        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds);
        
        // Merge roles into profiles
        return profiles.map(profile => ({
          ...profile,
          user_roles: roles?.filter(r => r.user_id === profile.id) || []
        }));
      }
      
      return profiles || [];
    },
    enabled: filters.status !== "admin" || adminUserIds !== undefined,
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      if (isAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");
        if (error) throw error;
      } else {
        // Add admin role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("Papel do usuário atualizado");
    },
    onError: () => {
      toast.error("Erro ao atualizar papel do usuário");
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          banned_at: new Date().toISOString(),
          ban_reason: "Banido pelo administrador" 
        })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("Usuário banido com sucesso");
    },
    onError: () => {
      toast.error("Erro ao banir usuário");
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          banned_at: null,
          ban_reason: null 
        })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("Banimento removido");
    },
    onError: () => {
      toast.error("Erro ao remover banimento");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("delete_user_completely", {
        p_user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminUsersCount"] });
      queryClient.invalidateQueries({ queryKey: ["adminUsersStats"] });
      toast.success("Usuário excluído permanentemente");
      setViewSheetOpen(false);
      setSelectedUserId(null);
    },
    onError: (error) => {
      console.error("Error deleting user:", error);
      toast.error("Erro ao excluir usuário");
    },
  });

  const isUserAdmin = (user: any) => {
    return user.user_roles?.some((r: any) => r.role === "admin");
  };

  const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      // Reset state when country changes
      if (key === "country" && value !== prev.country) {
        newFilters.state = "all";
      }
      return newFilters;
    });
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setFilters({
      status: "all",
      gender: "all",
      profileType: "all",
      country: "all",
      state: "all",
    });
    setSearch("");
    setCurrentPage(1);
  };

  const hasActiveFilters = filters.status !== "all" || 
    filters.gender !== "all" || 
    filters.profileType !== "all" || 
    filters.country !== "all" || 
    filters.state !== "all" ||
    search !== "";

  const statusOptions: { value: UserFilter; label: string }[] = [
    { value: "all", label: "Todos os status" },
    { value: "admin", label: `Administradores (${filterStats?.admins || 0})` },
    { value: "verified", label: `Verificados (${filterStats?.verified || 0})` },
    { value: "unverified", label: "Não verificados" },
    { value: "banned", label: `Banidos (${filterStats?.banned || 0})` },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with stats */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
            <p className="text-muted-foreground">
              Gerencie todos os usuários da plataforma
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
              Total
            </div>
            <p className="text-2xl font-bold text-foreground">{filterStats?.total || 0}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="text-muted-foreground text-sm">Masculino</div>
            <p className="text-2xl font-bold text-blue-500">{filterStats?.male || 0}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="text-muted-foreground text-sm">Feminino</div>
            <p className="text-2xl font-bold text-pink-500">{filterStats?.female || 0}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="text-muted-foreground text-sm">Verificados</div>
            <p className="text-2xl font-bold text-green-500">{filterStats?.verified || 0}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="text-muted-foreground text-sm">Administradores</div>
            <p className="text-2xl font-bold text-primary">{filterStats?.admins || 0}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="text-muted-foreground text-sm">Banidos</div>
            <p className="text-2xl font-bold text-destructive">{filterStats?.banned || 0}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou username..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Status Filter */}
            <Select value={filters.status} onValueChange={(v) => handleFilterChange("status", v as UserFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Gender Filter */}
            <Select value={filters.gender} onValueChange={(v) => handleFilterChange("gender", v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sexo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os sexos</SelectItem>
                <SelectItem value="homem">Masculino ({filterStats?.male || 0})</SelectItem>
                <SelectItem value="mulher">Feminino ({filterStats?.female || 0})</SelectItem>
              </SelectContent>
            </Select>

            {/* Profile Type Filter */}
            <Select value={filters.profileType} onValueChange={(v) => handleFilterChange("profileType", v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {profileTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Country Filter */}
            <Select value={filters.country} onValueChange={(v) => handleFilterChange("country", v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="País" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os países</SelectItem>
                {countries?.map((country) => (
                  <SelectItem key={country.id} value={country.id.toString()}>
                    {country.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* State Filter (only show if country is selected) */}
            {filters.country !== "all" && states && states.length > 0 && (
              <Select value={filters.state} onValueChange={(v) => handleFilterChange("state", v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.id.toString()}>
                      {state.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar filtros
              </Button>
            )}
          </div>
          
          {/* Active filters summary */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>
              Mostrando <strong className="text-foreground">{totalCount || 0}</strong> usuários
              {hasActiveFilters && " (filtrado)"}
            </span>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : users?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url || ""} />
                          <AvatarFallback>
                            {user.full_name?.charAt(0) || user.username.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">
                          {user.full_name || "Sem nome"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      @{user.username}
                    </TableCell>
                    <TableCell>
                      {isUserAdmin(user) ? (
                        <Badge variant="default" className="bg-primary">
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Usuário</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.banned_at ? (
                        <Badge variant="destructive">
                          Banido
                        </Badge>
                      ) : user.conta_verificada ? (
                        <Badge variant="outline" className="border-green-500 text-green-500">
                          Verificado
                        </Badge>
                      ) : (
                        <Badge variant="outline">Não verificado</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.created_at), "dd MMM yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setViewSheetOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/profile/${user.username}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver perfil público
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toggleAdminMutation.mutate({
                                userId: user.id,
                                isAdmin: isUserAdmin(user),
                              })
                            }
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            {isUserAdmin(user) ? "Remover admin" : "Tornar admin"}
                          </DropdownMenuItem>
                          {user.banned_at ? (
                            <>
                              <DropdownMenuItem
                                onClick={() => unbanUserMutation.mutate(user.id)}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Remover banimento
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  if (confirm("Tem certeza que deseja excluir este usuário permanentemente? Esta ação não pode ser desfeita.")) {
                                    deleteUserMutation.mutate(user.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir permanentemente
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => banUserMutation.mutate(user.id)}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Banir usuário
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount || 0)} de {totalCount} usuários
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-9"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ViewUserSheet
        open={viewSheetOpen}
        onOpenChange={setViewSheetOpen}
        userId={selectedUserId}
        onBan={(userId) => {
          banUserMutation.mutate(userId);
          setViewSheetOpen(false);
        }}
        onUnban={(userId) => {
          unbanUserMutation.mutate(userId);
          setViewSheetOpen(false);
        }}
        onToggleAdmin={(userId, isAdmin) => {
          toggleAdminMutation.mutate({ userId, isAdmin });
        }}
        onDelete={(userId) => {
          if (confirm("Tem certeza que deseja excluir este usuário permanentemente? Esta ação não pode ser desfeita e removerá todos os dados do usuário.")) {
            deleteUserMutation.mutate(userId);
          }
        }}
        isBanning={banUserMutation.isPending || unbanUserMutation.isPending}
        isDeleting={deleteUserMutation.isPending}
      />
    </AdminLayout>
  );
}
