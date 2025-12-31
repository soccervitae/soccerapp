import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  getPendingMessages,
  removePendingMessage,
  isOnline,
  onOnlineStatusChange,
} from '@/lib/offlineStorage';
import { toast } from 'sonner';

export const useOfflineSync = () => {
  const { user } = useAuth();
  const [online, setOnline] = useState(isOnline());
  const previousOnlineStatus = useRef<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Sync pending messages when coming back online
  const syncPendingMessages = useCallback(async () => {
    if (!user || !isOnline()) return;

    const pending = await getPendingMessages();
    if (pending.length === 0) return;

    setSyncing(true);
    setPendingCount(pending.length);

    let successCount = 0;

    for (const message of pending) {
      try {
        const { error } = await supabase.from('messages').insert({
          conversation_id: message.conversation_id,
          sender_id: user.id,
          content: message.content,
          media_url: message.media_url || null,
          media_type: message.media_type || null,
          reply_to_message_id: message.reply_to_message_id || null,
        });

        if (!error && message.tempId) {
          await removePendingMessage(message.tempId);
          successCount++;
        }
      } catch (error) {
        console.error('Error syncing message:', error);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} mensagem(s) sincronizada(s)`);
    }

    setPendingCount(0);
    setSyncing(false);
  }, [user]);

  // Listen for online/offline changes
  useEffect(() => {
    // Initialize previous status on mount
    previousOnlineStatus.current = isOnline();

    const unsubscribe = onOnlineStatusChange((currentOnline) => {
      const wasOffline = previousOnlineStatus.current === false;
      
      setOnline(currentOnline);
      
      if (currentOnline && wasOffline) {
        // Only show toast if user was actually offline before
        toast.success('Você está online novamente');
        syncPendingMessages();
      }
      // Removed offline toast - now using GlobalOfflineBanner instead
      
      // Update previous status
      previousOnlineStatus.current = currentOnline;
    });

    return unsubscribe;
  }, [syncPendingMessages]);

  // Check for pending messages on mount
  useEffect(() => {
    const checkPending = async () => {
      const pending = await getPendingMessages();
      setPendingCount(pending.length);
      
      if (isOnline() && pending.length > 0) {
        syncPendingMessages();
      }
    };

    checkPending();
  }, [syncPendingMessages]);

  return {
    isOnline: online,
    syncing,
    pendingCount,
    syncPendingMessages,
  };
};
