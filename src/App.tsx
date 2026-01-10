import { useEffect, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { HelmetProvider } from "react-helmet-async";
import { PageTransition } from "@/components/PageTransition";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PresenceProvider } from "@/contexts/PresenceContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import { ScrollToTop } from "@/components/ScrollToTop";
import { MessageNotificationProvider } from "@/components/notifications/MessageNotificationProvider";
import { useCallNotificationActions } from "@/hooks/useCallNotificationActions";
import PwaAutoUpdate from "@/components/pwa/PwaAutoUpdate";
import SplashScreen from "@/components/SplashScreen";
import { GlobalOfflineBanner } from "@/components/common/GlobalOfflineBanner";
import OrientationLock from "@/components/OrientationLock";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import FollowList from "./pages/FollowList";
import Explore from "./pages/Explore";
import Auth from "./pages/Auth";
import EditProfile from "./pages/settings/EditProfile";
import Privacy from "./pages/settings/Privacy";
import Security from "./pages/settings/Security";
import Notifications from "./pages/settings/Notifications";
import Settings from "./pages/settings/Index";
import Saved from "./pages/settings/Saved";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";

import TwoFactorVerify from "./pages/TwoFactorVerify";
import ForgotPassword from "./pages/ForgotPassword";
import CompleteProfile from "./pages/CompleteProfile";
import Welcome from "./pages/Welcome";
import Teams from "./pages/Teams";
import Install from "./pages/Install";
import Landing from "./pages/Landing";

import AdminDashboard from "./pages/admin/Index";
import AdminContent from "./pages/admin/Content";
import AdminUsers from "./pages/admin/Users";
import AdminPosts from "./pages/admin/Posts";
import AdminReports from "./pages/admin/Reports";
import AdminTeams from "./pages/admin/Teams";
import AdminChampionships from "./pages/admin/Championships";
import AdminSettings from "./pages/admin/Settings";
import { AdminRoute } from "@/components/admin/AdminRoute";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const CallNotificationHandler = () => {
  useCallNotificationActions();
  return null;
};

// Check if running as PWA
const isPWA = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

// Component to handle landing vs authenticated index
const LandingOrIndex = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return null;
  }
  
  // If not logged in and in PWA mode, redirect to auth
  if (!user) {
    if (isPWA()) {
      return <Navigate to="/auth" replace />;
    }
    return <PageTransition><Landing /></PageTransition>;
  }
  
  return (
    <ProtectedRoute>
      <PageTransition><Index /></PageTransition>
    </ProtectedRoute>
  );
};

const AnimatedRoutes = () => {
  return (
    <Routes>
      {/* Landing page for unauthenticated users, feed for authenticated */}
      <Route path="/" element={<LandingOrIndex />} />
      
      {/* Public auth routes */}
      <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      <Route path="/signup" element={<Navigate to="/auth" replace />} />
      <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
      <Route path="/two-factor-verify" element={<PageTransition><TwoFactorVerify /></PageTransition>} />
      
      {/* Install page - public, no login required */}
      <Route path="/install" element={<PageTransition><Install /></PageTransition>} />
      
      {/* Complete profile route - requires login but not complete profile or onboarding */}
      <Route path="/complete-profile" element={
        <ProtectedRoute requireCompleteProfile={false} requireOnboarding={false}>
          <PageTransition><CompleteProfile /></PageTransition>
        </ProtectedRoute>
      } />
      
      {/* Welcome/onboarding route - requires login and complete profile but not onboarding */}
      <Route path="/welcome" element={
        <ProtectedRoute requireCompleteProfile={true} requireOnboarding={false}>
          <PageTransition><Welcome /></PageTransition>
        </ProtectedRoute>
      } />
      
      {/* Protected routes - require login and complete profile */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <PageTransition><Profile /></PageTransition>
        </ProtectedRoute>
      } />
      <Route path="/followers" element={
        <ProtectedRoute>
          <PageTransition><FollowList /></PageTransition>
        </ProtectedRoute>
      } />
      <Route path="/:username" element={
        <ProtectedRoute>
          <PageTransition><Profile /></PageTransition>
        </ProtectedRoute>
      } />
      <Route path="/:username/followers" element={
        <ProtectedRoute>
          <PageTransition><FollowList /></PageTransition>
        </ProtectedRoute>
      } />
      <Route path="/explore" element={
        <ProtectedRoute>
          <PageTransition><Explore /></PageTransition>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <PageTransition><Settings /></PageTransition>
        </ProtectedRoute>
      } />
      <Route path="/settings/profile" element={
        <ProtectedRoute>
          <PageTransition><EditProfile /></PageTransition>
        </ProtectedRoute>
      } />
      <Route path="/settings/privacy" element={
        <ProtectedRoute>
          <PageTransition><Privacy /></PageTransition>
        </ProtectedRoute>
      } />
      <Route path="/settings/security" element={
        <ProtectedRoute>
          <PageTransition><Security /></PageTransition>
        </ProtectedRoute>
      } />
      <Route path="/settings/notifications" element={
        <ProtectedRoute>
          <PageTransition><Notifications /></PageTransition>
        </ProtectedRoute>
      } />
      <Route path="/settings/saved" element={
        <ProtectedRoute>
          <PageTransition><Saved /></PageTransition>
        </ProtectedRoute>
      } />
      <Route path="/messages" element={
        <ProtectedRoute>
          <PageTransition><Messages /></PageTransition>
        </ProtectedRoute>
      } />
      <Route path="/messages/:conversationId" element={
        <ProtectedRoute>
          <PageTransition><Chat /></PageTransition>
        </ProtectedRoute>
      } />
      <Route path="/teams" element={
        <ProtectedRoute>
          <PageTransition><Teams /></PageTransition>
        </ProtectedRoute>
      } />
      
      {/* Admin routes */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/content" element={<AdminRoute><AdminContent /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/posts" element={<AdminRoute><AdminPosts /></AdminRoute>} />
      <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
      <Route path="/admin/teams" element={<AdminRoute><AdminTeams /></AdminRoute>} />
      <Route path="/admin/championships" element={<AdminRoute><AdminChampionships /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
      
      <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
    </Routes>
  );
};

// Detecta se é a primeira abertura do PWA na sessão
const isFirstOpen = () => {
  const isPWA = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');
  
  const hasOpenedThisSession = sessionStorage.getItem('pwa-session-started');
  
  if (isPWA && !hasOpenedThisSession) {
    sessionStorage.setItem('pwa-session-started', 'true');
    return true;
  }
  
  return false;
};

const App = () => {
  const [showSplash, setShowSplash] = useState(isFirstOpen);

  useEffect(() => {
    // Lock screen orientation to portrait on supported browsers
    const lockOrientation = async () => {
      try {
        const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
        if (orientation && orientation.lock) {
          await orientation.lock('portrait');
        }
      } catch {
        // Silent fail - API not supported or not allowed
      }
    };
    lockOrientation();

    // Hide splash screen after 2.5 seconds (only if showing)
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <PresenceProvider>
              <AnimatePresence mode="wait">
                {showSplash && <SplashScreen key="splash" />}
              </AnimatePresence>
              <OrientationLock />
              {/* PWA auto-update hook */}
              <PwaAutoUpdate />
              <BrowserRouter>
                <MessageNotificationProvider>
                  <CallNotificationHandler />
                  <ScrollToTop />
                  <GlobalOfflineBanner />
                  <AnimatedRoutes />
                </MessageNotificationProvider>
              </BrowserRouter>
            </PresenceProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
