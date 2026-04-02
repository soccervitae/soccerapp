import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useRequirePwa } from "@/hooks/useRequirePwa";
import { useIsAdmin } from "@/hooks/useIsAdmin";
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
  requirePwa = false,
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { shouldBlockAccess, isLoading: pwaLoading } = useRequirePwa();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <ProtectedRouteInner
      requireCompleteProfile={requireCompleteProfile}
      requireOnboarding={requireOnboarding}
      requirePwa={requirePwa}
      shouldBlockAccess={shouldBlockAccess}
      pwaLoading={pwaLoading}
      location={location}
    >
      {children}
    </ProtectedRouteInner>
  );
};

const ProtectedRouteInner = ({ 
  children, 
  requireCompleteProfile,
  requireOnboarding,
  requirePwa,
  shouldBlockAccess,
  pwaLoading,
  location,
}: {
  children: React.ReactNode;
  requireCompleteProfile: boolean;
  requireOnboarding: boolean;
  requirePwa: boolean;
  shouldBlockAccess: boolean;
  pwaLoading: boolean;
  location: ReturnType<typeof useLocation>;
}) => {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  if (profileLoading || pwaLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const profileData = profile as any;

  // Redirect admin users to admin dashboard
  if (isAdmin && !location.pathname.startsWith("/admin")) {
    return <Navigate to="/admin" replace />;
  }

  // Single-pass redirect calculation to avoid cascade
  const currentPath = location.pathname;
  
  // Determine the correct redirect destination in priority order
  let redirectTo: string | null = null;

  if (requirePwa && shouldBlockAccess && currentPath !== "/install") {
    redirectTo = "/install";
  } else if (profile && !(profileData.conta_verificada) && currentPath !== "/verify-account") {
    redirectTo = "/verify-account";
  } else if (
    profile &&
    profileData.conta_verificada &&
    (!profileData.account_type || (requireCompleteProfile && !profileData.profile_completed)) &&
    currentPath !== "/choose-account-type"
  ) {
    redirectTo = "/choose-account-type";
  } else if (
    requireOnboarding &&
    profile &&
    profileData.profile_completed &&
    !profileData.onboarding_completed &&
    currentPath !== "/welcome" &&
    currentPath !== "/complete-profile"
  ) {
    redirectTo = "/welcome";
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
