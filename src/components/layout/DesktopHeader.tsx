import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useConversations } from "@/hooks/useConversations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ResponsiveAlertModal } from "@/components/ui/responsive-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const DesktopHeader = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { totalUnread } = useConversations();
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      setShowLogoutConfirm(false);
      await signOut();
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="h-full max-w-screen-2xl mx-auto px-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <button onClick={() => navigate("/")} className="flex-shrink-0">
            <img
              src="https://gkkuttabavwxjuibmrnr.supabase.co/storage/v1/object/public/escudotime/LOGOSITE/soccervitaeoff.png"
              alt="SOCCER VITAE"
              className="h-7 object-contain"
            />
          </button>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[20px]">
                search
              </span>
              <Input
                type="text"
                placeholder="Buscar atletas, clubes, treinadores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-transparent focus:border-primary focus:bg-background"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <NotificationBell />

            <button
              onClick={() => navigate("/messages")}
              className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-foreground transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">chat</span>
              {totalUnread > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {getInitials(profile?.full_name || profile?.username)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <span className="material-symbols-outlined mr-2 text-[18px]">person</span>
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <span className="material-symbols-outlined mr-2 text-[18px]">settings</span>
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowLogoutConfirm(true)} className="text-destructive focus:text-destructive">
                  <span className="material-symbols-outlined mr-2 text-[18px]">logout</span>
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <ResponsiveAlertModal
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Sair da conta?"
        description="Você será desconectado e precisará fazer login novamente para acessar sua conta."
        cancelText="Cancelar"
        confirmText={isLoggingOut ? "Saindo..." : "Sair"}
        onConfirm={handleSignOut}
        confirmVariant="destructive"
      />
    </>
  );
};
