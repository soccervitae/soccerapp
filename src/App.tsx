import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RequirePwaInstall } from "@/components/RequirePwaInstall";
import { ScrollToTop } from "@/components/ScrollToTop";
import PwaUpdatePrompt from "@/components/pwa/PwaUpdatePrompt";
import SplashScreen from "@/components/SplashScreen";
import OrientationLock from "@/components/OrientationLock";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import FollowList from "./pages/FollowList";
import Explore from "./pages/Explore";
import Auth from "./pages/Auth";
import EditProfile from "./pages/settings/EditProfile";
import Privacy from "./pages/settings/Privacy";
import Security from "./pages/settings/Security";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import TwoFactorVerify from "./pages/TwoFactorVerify";
import ForgotPassword from "./pages/ForgotPassword";
import InstallRequired from "./pages/InstallRequired";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public auth routes */}
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/signup" element={<Navigate to="/auth" replace />} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/two-factor-verify" element={<PageTransition><TwoFactorVerify /></PageTransition>} />
        
        {/* Install required page - needs login but NOT PWA check (to avoid infinite loop) */}
        <Route path="/install-required" element={
          <ProtectedRoute>
            <PageTransition><InstallRequired /></PageTransition>
          </ProtectedRoute>
        } />
        
        {/* Protected routes - require login AND PWA */}
        <Route path="/" element={
          <ProtectedRoute>
            <RequirePwaInstall>
              <PageTransition><Index /></PageTransition>
            </RequirePwaInstall>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <RequirePwaInstall>
              <PageTransition><Profile /></PageTransition>
            </RequirePwaInstall>
          </ProtectedRoute>
        } />
        <Route path="/followers" element={
          <ProtectedRoute>
            <RequirePwaInstall>
              <PageTransition><FollowList /></PageTransition>
            </RequirePwaInstall>
          </ProtectedRoute>
        } />
        <Route path="/:username" element={
          <ProtectedRoute>
            <RequirePwaInstall>
              <PageTransition><Profile /></PageTransition>
            </RequirePwaInstall>
          </ProtectedRoute>
        } />
        <Route path="/:username/followers" element={
          <ProtectedRoute>
            <RequirePwaInstall>
              <PageTransition><FollowList /></PageTransition>
            </RequirePwaInstall>
          </ProtectedRoute>
        } />
        <Route path="/explore" element={
          <ProtectedRoute>
            <RequirePwaInstall>
              <PageTransition><Explore /></PageTransition>
            </RequirePwaInstall>
          </ProtectedRoute>
        } />
        <Route path="/settings/profile" element={
          <ProtectedRoute>
            <RequirePwaInstall>
              <PageTransition><EditProfile /></PageTransition>
            </RequirePwaInstall>
          </ProtectedRoute>
        } />
        <Route path="/settings/privacy" element={
          <ProtectedRoute>
            <RequirePwaInstall>
              <PageTransition><Privacy /></PageTransition>
            </RequirePwaInstall>
          </ProtectedRoute>
        } />
        <Route path="/settings/security" element={
          <ProtectedRoute>
            <RequirePwaInstall>
              <PageTransition><Security /></PageTransition>
            </RequirePwaInstall>
          </ProtectedRoute>
        } />
        <Route path="/messages" element={
          <ProtectedRoute>
            <RequirePwaInstall>
              <PageTransition><Messages /></PageTransition>
            </RequirePwaInstall>
          </ProtectedRoute>
        } />
        <Route path="/messages/:conversationId" element={
          <ProtectedRoute>
            <RequirePwaInstall>
              <PageTransition><Chat /></PageTransition>
            </RequirePwaInstall>
          </ProtectedRoute>
        } />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

// Check if running as installed PWA
const isPWA = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(isPWA());

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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AnimatePresence mode="wait">
            {showSplash && <SplashScreen key="splash" />}
          </AnimatePresence>
          <Toaster />
          <Sonner />
          <OrientationLock />
          <PwaUpdatePrompt />
          <BrowserRouter>
            <ScrollToTop />
            <AnimatedRoutes />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
