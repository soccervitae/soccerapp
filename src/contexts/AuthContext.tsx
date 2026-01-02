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

// Get transfer token from URL
const getTransferTokenFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('transfer_token');
};

// Remove transfer token from URL without reload
const removeTransferTokenFromUrl = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('transfer_token');
  window.history.replaceState({}, '', url.toString());
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRestoredRef = useRef(false);
  const tokenRedemptionRef = useRef(false);

  useEffect(() => {
    const initializeAuth = async () => {
      // First, check for transfer token in URL (highest priority for PWA)
      const transferToken = getTransferTokenFromUrl();
      
      if (transferToken && !tokenRedemptionRef.current) {
        tokenRedemptionRef.current = true;
        console.log('[Auth] Found transfer token in URL, attempting to redeem...');
        
        try {
          const { data, error } = await supabase.functions.invoke('redeem-session-token', {
            body: { token: transferToken }
          });

          if (error) {
            console.error('[Auth] Failed to redeem transfer token:', error);
          } else if (data?.refresh_token) {
            console.log('[Auth] Transfer token redeemed, restoring session...');
            
            // Use the refresh token to get a new session
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
              refresh_token: data.refresh_token
            });
            
            if (refreshData.session && !refreshError) {
              console.log('[Auth] Session restored from transfer token');
              setSession(refreshData.session);
              setUser(refreshData.session.user);
              
              // Remove token from URL
              removeTransferTokenFromUrl();
              setLoading(false);
              return;
            } else {
              console.error('[Auth] Failed to refresh session:', refreshError);
            }
          }
          
          // Remove invalid token from URL
          removeTransferTokenFromUrl();
        } catch (error) {
          console.error('[Auth] Error redeeming transfer token:', error);
          removeTransferTokenFromUrl();
        }
      }

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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
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
