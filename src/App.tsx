import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import EditProfile from "./pages/settings/EditProfile";
import Privacy from "./pages/settings/Privacy";
import Security from "./pages/settings/Security";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import TwoFactorVerify from "./pages/TwoFactorVerify";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
        <Route path="/two-factor-verify" element={<PageTransition><TwoFactorVerify /></PageTransition>} />
        <Route path="/" element={<ProtectedRoute><PageTransition><Index /></PageTransition></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
        <Route path="/explore" element={<ProtectedRoute><PageTransition><Explore /></PageTransition></ProtectedRoute>} />
        <Route path="/settings/profile" element={<ProtectedRoute><PageTransition><EditProfile /></PageTransition></ProtectedRoute>} />
        <Route path="/settings/privacy" element={<ProtectedRoute><PageTransition><Privacy /></PageTransition></ProtectedRoute>} />
        <Route path="/settings/security" element={<ProtectedRoute><PageTransition><Security /></PageTransition></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><PageTransition><Messages /></PageTransition></ProtectedRoute>} />
        <Route path="/messages/:conversationId" element={<ProtectedRoute><PageTransition><Chat /></PageTransition></ProtectedRoute>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
