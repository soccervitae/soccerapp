import { AdminSidebar, AdminMobileHeader } from "./AdminSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { RefreshableContainer } from "@/components/common/RefreshableContainer";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface AdminRefreshContextType {
  triggerRefresh: () => void;
  onRefreshCallback: (callback: () => Promise<void>) => void;
}

const AdminRefreshContext = createContext<AdminRefreshContextType | null>(null);

export function useAdminRefresh() {
  const context = useContext(AdminRefreshContext);
  if (!context) {
    throw new Error("useAdminRefresh must be used within AdminLayout");
  }
  return context;
}

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const isMobile = useIsMobile();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCallback, setRefreshCallback] = useState<(() => Promise<void>) | null>(null);

  const handleRefresh = useCallback(async () => {
    if (refreshCallback) {
      setIsRefreshing(true);
      try {
        await refreshCallback();
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [refreshCallback]);

  const onRefreshCallback = useCallback((callback: () => Promise<void>) => {
    setRefreshCallback(() => callback);
  }, []);

  const triggerRefresh = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  const contextValue: AdminRefreshContextType = {
    triggerRefresh,
    onRefreshCallback,
  };

  const mainContent = (
    <main 
      className={`flex-1 overflow-auto ${isMobile ? 'p-4' : 'p-6'}`}
      style={isMobile ? { 
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))'
      } : undefined}
    >
      {children}
    </main>
  );

  return (
    <AdminRefreshContext.Provider value={contextValue}>
      <div className="flex flex-col min-h-screen bg-background">
        <AdminMobileHeader />
        <div className="flex flex-1">
          <AdminSidebar />
          {isMobile ? (
            <RefreshableContainer
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              className="flex-1"
            >
              {mainContent}
            </RefreshableContainer>
          ) : (
            mainContent
          )}
        </div>
      </div>
    </AdminRefreshContext.Provider>
  );
}
