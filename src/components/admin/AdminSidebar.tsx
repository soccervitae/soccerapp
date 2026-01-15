import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  Flag,
  Shield,
  Trophy,
  Medal,
  Settings,
  LogOut,
  Sparkles,
  MessageSquarePlus,
  Eye,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ResponsiveAlertModal } from "@/components/ui/responsive-modal";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Sparkles, label: "Conteúdo", path: "/admin/content" },
  { icon: Users, label: "Usuários", path: "/admin/users" },
  { icon: FileText, label: "Posts", path: "/admin/posts" },
  { icon: Eye, label: "Moderação", path: "/admin/moderation" },
  { icon: Flag, label: "Denúncias", path: "/admin/reports" },
  { icon: MessageSquarePlus, label: "Suporte", path: "/admin/support" },
  { icon: Shield, label: "Times", path: "/admin/teams" },
  { icon: Trophy, label: "Campeonatos", path: "/admin/championships" },
  { icon: Medal, label: "Conquistas", path: "/admin/achievements" },
  { icon: Settings, label: "Configurações", path: "/admin/settings" },
];

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const location = useLocation();
  const { signOut } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      toast.success("Logout realizado com sucesso");
    } catch (error) {
      toast.error("Erro ao fazer logout");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-8">
        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
          <Shield className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-bold text-foreground">Admin Panel</h1>
          <p className="text-xs text-muted-foreground">Soccer Vitae</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setShowLogoutModal(true)}
        >
          <LogOut className="h-5 w-5" />
          Sair
        </Button>
      </div>

      <ResponsiveAlertModal
        open={showLogoutModal}
        onOpenChange={setShowLogoutModal}
        title="Sair da conta"
        description="Tem certeza que deseja sair do painel administrativo?"
        confirmText={isLoggingOut ? "Saindo..." : "Sair"}
        onConfirm={handleLogout}
        confirmVariant="destructive"
      />
    </>
  );
}

export function AdminSidebar() {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  if (isMobile) {
    return null; // Mobile sidebar is rendered in AdminMobileHeader
  }

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen p-4 flex flex-col shrink-0">
      <SidebarContent />
    </aside>
  );
}

export function AdminMobileHeader() {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Get current page title
  const currentItem = menuItems.find(item => item.path === location.pathname);
  const pageTitle = currentItem?.label || "Admin";

  if (!isMobile) {
    return null;
  }

  return (
    <header 
      className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center gap-3"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="left" 
          className="w-72 p-4 flex flex-col"
          style={{ 
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))'
          }}
        >
          <SidebarContent onItemClick={() => setIsOpen(false)} />
        </SheetContent>
      </Sheet>
      
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <span className="font-semibold text-foreground">{pageTitle}</span>
      </div>
    </header>
  );
}
