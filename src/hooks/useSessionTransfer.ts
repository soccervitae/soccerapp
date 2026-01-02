import { useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { saveSessionToIndexedDB, clearSessionFromIndexedDB } from '@/lib/sessionStorage';

// Check if running as PWA
const isPWA = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

export const useSessionTransfer = (session: Session | null) => {
  // Save session to IndexedDB when authenticated in browser (not PWA)
  const saveSessionForTransfer = useCallback(async () => {
    if (!session?.access_token || !session?.refresh_token) {
      return;
    }

    // Only save when in browser, not PWA
    if (isPWA()) {
      return;
    }

    try {
      await saveSessionToIndexedDB(
        session.access_token,
        session.refresh_token,
        session.expires_at
      );
      console.log('[SessionTransfer] Session saved for PWA transfer');
    } catch (error) {
      console.error('[SessionTransfer] Failed to save session:', error);
    }
  }, [session]);

  // Automatically save session when it changes (in browser mode)
  useEffect(() => {
    if (session) {
      saveSessionForTransfer();
    }
  }, [session, saveSessionForTransfer]);

  // Clear session from IndexedDB (after successful PWA restoration)
  const clearTransferSession = useCallback(async () => {
    await clearSessionFromIndexedDB();
  }, []);

  return {
    saveSessionForTransfer,
    clearTransferSession,
    isPWA: isPWA(),
  };
};
