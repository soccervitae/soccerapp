import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { clearVideoMetadataCache } from "@/lib/videoMetadataCache";
import { getSessionFromIndexedDB, saveSessionToIndexedDB, clearSessionFromIndexedDB } from "@/lib/sessionStorage";

interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  accountType?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

// Check if running as PWA
const isPWA = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

export const AuthProvider = ({ children, queryClient }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRestoredRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    // CRITICAL: Set up onAuthStateChange BEFORE getSession (Supabase best practice)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('[Auth] onAuthStateChange:', event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        
        // Save session to IndexedDB in ALL modes (not just browser)
        if (currentSession) {
          saveSessionToIndexedDB(
            currentSession.access_token,
            currentSession.refresh_token,
            currentSession.expires_at
          );
        }

        // Invalidate profile cache on sign in to ensure fresh data
        if (event === 'SIGNED_IN' && queryClient) {
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["profile"] });
          }, 100);
        }
      }
    );

    // Now get the initial session
    const initializeAuth = async () => {
      if (initializedRef.current) return;
      initializedRef.current = true;

      const { data: { session: existingSession } } = await supabase.auth.getSession();
      
      if (existingSession) {
        setSession(existingSession);
        setUser(existingSession.user);
        setLoading(false);
        
        // Save to IndexedDB for PWA persistence
        saveSessionToIndexedDB(
          existingSession.access_token,
          existingSession.refresh_token,
          existingSession.expires_at
        );
        return;
      }

      // No existing session - try to restore from IndexedDB (especially for PWA)
      if (!sessionRestoredRef.current) {
        sessionRestoredRef.current = true;
        
        try {
          const storedSession = await getSessionFromIndexedDB();
          
          if (storedSession) {
            console.log('[Auth] Found stored session, attempting to restore...');
            
            const { data, error } = await supabase.auth.setSession({
              access_token: storedSession.access_token,
              refresh_token: storedSession.refresh_token,
            });
            
            if (data.session && !error) {
              console.log('[Auth] Session restored successfully');
              // onAuthStateChange will handle setting state
            } else {
              console.log('[Auth] Session restoration failed:', error?.message);
              await clearSessionFromIndexedDB();
            }
          }
        } catch (error) {
          console.error('[Auth] Error restoring session:', error);
        }
      }
      
      setLoading(false);
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const signUp = async ({ email, password, firstName, lastName, accountType }: SignUpData) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
          account_type: accountType || null,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return { error };
    }

    // Check if user is banned (non-blocking)
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("banned_at, ban_reason, banned_until")
        .eq("id", data.user.id)
        .single();

      if (profile?.banned_at) {
        const bannedUntil = (profile as any).banned_until;
        
        // Check if temporary ban has expired
        if (bannedUntil && new Date(bannedUntil) < new Date()) {
          supabase
            .from("profiles")
            .update({ 
              banned_at: null, 
              ban_reason: null, 
              banned_until: null 
            })
            .eq("id", data.user.id)
            .then(() => {});
          return { error: null };
        }

        // Sign out the banned user immediately
        await supabase.auth.signOut();
        
        let banMessage: string;
        if (bannedUntil) {
          const expiryDate = new Date(bannedUntil);
          const formattedDate = expiryDate.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          banMessage = profile.ban_reason 
            ? `Sua conta está suspensa até ${formattedDate}. Motivo: ${profile.ban_reason}`
            : `Sua conta está suspensa até ${formattedDate}.`;
        } else {
          banMessage = profile.ban_reason 
            ? `Sua conta foi banida permanentemente. Motivo: ${profile.ban_reason}`
            : "Sua conta foi banida permanentemente.";
        }
        
        const banError = new Error(banMessage);
        return { error: banError };
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await clearVideoMetadataCache();
    await clearSessionFromIndexedDB();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
