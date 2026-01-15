import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [isReady, setIsReady] = useState(false);

  // Wait for auth state to stabilize after login
  useEffect(() => {
    if (!authLoading && user) {
      // Small delay to ensure admin check has completed
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 50);
      return () => clearTimeout(timer);
    } else if (!authLoading && !user) {
      setIsReady(true);
    }
  }, [authLoading, user]);

  // Show loading while auth is loading, admin check is loading, or not yet ready
  if (authLoading || adminLoading || !isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
