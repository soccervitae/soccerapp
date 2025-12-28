import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { AuthProvider } from "@/contexts/AuthContext";
import { PresenceProvider } from "@/contexts/PresenceContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import { ScrollToTop } from "@/components/ScrollToTop";
import { MessageNotificationProvider } from "@/components/notifications/MessageNotificationProvider";
import PwaAutoUpdate from "@/components/pwa/PwaAutoUpdate";
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
import CompleteProfile from "./pages/CompleteProfile";
import Welcome from "./pages/Welcome";

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
        <Route path="/" element={
          <ProtectedRoute>
            <PageTransition><Index /></PageTransition>
          </ProtectedRoute>
        } />
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
          <PresenceProvider>
            <AnimatePresence mode="wait">
              {showSplash && <SplashScreen key="splash" />}
            </AnimatePresence>
            <Toaster />
            <Sonner />
            <OrientationLock />
            {/* PWA auto-update hook */}
            <PwaAutoUpdate />
            <BrowserRouter>
              <MessageNotificationProvider>
                <ScrollToTop />
                <AnimatedRoutes />
              </MessageNotificationProvider>
            </BrowserRouter>
          </PresenceProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
