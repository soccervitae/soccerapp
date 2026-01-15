import { AdminSidebar, AdminMobileHeader } from "./AdminSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AdminMobileHeader />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className={`flex-1 overflow-auto ${isMobile ? 'p-4' : 'p-6'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
