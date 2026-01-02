import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useRequirePwa } from "@/hooks/useRequirePwa";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireCompleteProfile?: boolean;
  requireOnboarding?: boolean;
  requirePwa?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireCompleteProfile = true,
  requireOnboarding = true,
  requirePwa = true,
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { shouldBlockAccess, isLoading: pwaLoading } = useRequirePwa();
  const location = useLocation();

  if (loading || profileLoading || pwaLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to install page if mobile and not PWA
  if (requirePwa && shouldBlockAccess && location.pathname !== "/install") {
    return <Navigate to="/install" replace />;
  }

  const profileData = profile as any;

  // Redirect to complete profile if profile is not completed
  if (
    requireCompleteProfile &&
    profile &&
    !profileData.profile_completed &&
    location.pathname !== "/complete-profile"
  ) {
    return <Navigate to="/complete-profile" replace />;
  }

  // Redirect to welcome/onboarding if profile is complete but onboarding is not
  if (
    requireOnboarding &&
    profile &&
    profileData.profile_completed &&
    !profileData.onboarding_completed &&
    location.pathname !== "/welcome" &&
    location.pathname !== "/complete-profile"
  ) {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
};
