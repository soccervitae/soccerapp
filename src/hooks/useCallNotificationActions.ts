import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface CallNotificationMessage {
  type: 'ANSWER_CALL_FROM_NOTIFICATION' | 'CALL_REJECTED_FROM_NOTIFICATION';
  callerId: string;
  conversationId: string;
}

export const useCallNotificationActions = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleMessage = (event: MessageEvent<CallNotificationMessage>) => {
      if (event.data?.type === 'ANSWER_CALL_FROM_NOTIFICATION') {
        const { conversationId } = event.data;
        console.log('[CallNotification] Answering call from notification, navigating to:', conversationId);
        navigate(`/messages/${conversationId}?answerCall=true`);
      }
      
      // CALL_REJECTED_FROM_NOTIFICATION is handled in useVideoCall via the signaling channel
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, [navigate]);
};
