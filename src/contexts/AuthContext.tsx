import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearVideoMetadataCache } from "@/lib/videoMetadataCache";
import { getSessionFromIndexedDB, saveSessionToIndexedDB, clearSessionFromIndexedDB } from "@/lib/sessionStorage";

interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
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
}

// Check if running as PWA
const isPWA = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRestoredRef = useRef(false);

  useEffect(() => {
    const initializeAuth = async () => {
      // Check for existing session
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      
      if (existingSession) {
        // Already has session, use it
        setSession(existingSession);
        setUser(existingSession.user);
        setLoading(false);
        
        // Save to IndexedDB for future PWA transfer (if in browser)
        if (!isPWA() && existingSession.access_token && existingSession.refresh_token) {
          saveSessionToIndexedDB(
            existingSession.access_token,
            existingSession.refresh_token,
            existingSession.expires_at
          );
        }
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
              setSession(data.session);
              setUser(data.session.user);
              
              // Clear transfer session after successful restoration in PWA
              if (isPWA()) {
                await clearSessionFromIndexedDB();
              }
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        
        // Save session to IndexedDB when authenticated (for PWA transfer)
        if (currentSession && !isPWA()) {
          saveSessionToIndexedDB(
            currentSession.access_token,
            currentSession.refresh_token,
            currentSession.expires_at
          );
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async ({ email, password, firstName, lastName }: SignUpData) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
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

    // Check if user is banned
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
          // Ban has expired, remove it automatically
          await supabase
            .from("profiles")
            .update({ 
              banned_at: null, 
              ban_reason: null, 
              banned_until: null 
            })
            .eq("id", data.user.id);
          // Allow login to continue
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
    // Clear video metadata cache on logout
    await clearVideoMetadataCache();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
