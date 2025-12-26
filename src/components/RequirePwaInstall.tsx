import { Navigate } from "react-router-dom";
import { useIsPWA } from "@/hooks/useIsPWA";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface RequirePwaInstallProps {
  children: React.ReactNode;
}

export const RequirePwaInstall = ({ children }: RequirePwaInstallProps) => {
  const { user, loading } = useAuth();
  const isPWA = useIsPWA();

  // Wait for auth to load
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not logged in, ProtectedRoute will handle redirect
  if (!user) {
    return <>{children}</>;
  }

  // If logged in but not in PWA, redirect to install-required
  if (!isPWA) {
    return <Navigate to="/install-required" replace />;
  }

  return <>{children}</>;
};
