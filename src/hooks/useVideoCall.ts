import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed';
export type VideoCallStatus = 'completed' | 'missed' | 'rejected' | 'no_answer';
export type CallType = 'video' | 'voice';

export interface VideoCallMetadata {
  status: VideoCallStatus;
  duration?: number;
  startedAt?: string;
  endedAt?: string;
  initiator?: string;
  callType?: CallType;
}

interface CallState {
  isCallActive: boolean;
  isIncomingCall: boolean;
  isCalling: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callerInfo: Profile | null;
  connectionStatus: ConnectionStatus;
  callType: CallType | null;
}

interface SignalingMessage {
  type: "call_request" | "call_accepted" | "call_rejected" | "call_ended" | "daily_room_ready";
  from: string;
  to: string;
  callerInfo?: Profile;
  callType?: CallType;
  roomUrl?: string;
}

const CALL_TIMEOUT_MS = 30000;

export const useVideoCall = (conversationId: string | null, participant: Profile | null) => {
  const { user } = useAuth();
  const { showCallNotification } = usePushNotifications();
  const [callState, setCallState] = useState<CallState>({
    isCallActive: false,
    isIncomingCall: false,
    isCalling: false,
    isVideoEnabled: true,
    isAudioEnabled: true,
    localStream: null,
    remoteStream: null,
    callerInfo: null,
    connectionStatus: 'idle',
    callType: null,
  });

  const dailyCallRef = useRef<DailyCall | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const callTimeoutRef = useRef<number | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);
  const isInitiatorRef = useRef<boolean>(false);
  const callConnectedRef = useRef<boolean>(false);
  const roomUrlRef = useRef<string | null>(null);

  const saveCallToHistory = useCallback(async (status: VideoCallStatus, currentCallType?: CallType) => {
    if (!conversationId || !user) return;

    const duration = callStartTimeRef.current
      ? Math.floor((Date.now() - callStartTimeRef.current.getTime()) / 1000)
      : 0;

    const callTypeToSave = currentCallType || callState.callType || 'video';

    const metadata: VideoCallMetadata = {
      status,
      duration: status === 'completed' && duration > 0 ? duration : undefined,
      startedAt: callStartTimeRef.current?.toISOString(),
      endedAt: new Date().toISOString(),
      initiator: isInitiatorRef.current ? user.id : undefined,
      callType: callTypeToSave,
    };

    try {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: JSON.stringify(metadata),
        media_type: callTypeToSave === 'voice' ? "voice_call" : "video_call",
      });
    } catch (error) {
      console.error("[Daily] Error saving call to history:", error);
    }
  }, [conversationId, user, callState.callType]);

  const cleanupCall = useCallback((saveStatus?: VideoCallStatus) => {
    console.log("[Daily] Cleaning up call...", saveStatus);

    if (saveStatus) {
      saveCallToHistory(saveStatus);
    }

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    // Destroy Daily call object
    if (dailyCallRef.current) {
      try {
        dailyCallRef.current.destroy();
      } catch (e) {
        console.warn("[Daily] Error destroying call object:", e);
      }
      dailyCallRef.current = null;
    }

    callStartTimeRef.current = null;
    isInitiatorRef.current = false;
    callConnectedRef.current = false;
    roomUrlRef.current = null;

    setCallState({
      isCallActive: false,
      isIncomingCall: false,
      isCalling: false,
      isVideoEnabled: true,
      isAudioEnabled: true,
      localStream: null,
      remoteStream: null,
      callerInfo: null,
      connectionStatus: 'idle',
      callType: null,
    });
  }, [saveCallToHistory]);

  const clearCallTimeout = useCallback(() => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
  }, []);

  const sendSignalingMessage = useCallback(
    async (message: Omit<SignalingMessage, "from">) => {
      if (!channelRef.current || !user) return;

      await channelRef.current.send({
        type: "broadcast",
        event: "signaling",
        payload: { ...message, from: user.id },
      });
    },
    [user]
  );

  // Join a Daily.co room
  const joinDailyRoom = useCallback(async (roomUrl: string, callType: CallType) => {
    console.log("[Daily] Joining room:", roomUrl);
    
    try {
      const callObject = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: callType === 'video',
      });

      dailyCallRef.current = callObject;

      // Set up event listeners
      callObject.on("joined-meeting", () => {
        console.log("[Daily] Joined meeting");
        setCallState(prev => ({ ...prev, connectionStatus: 'connecting' }));
        
        // Get local tracks
        const localParticipant = callObject.participants().local;
        if (localParticipant) {
          const tracks = localParticipant.tracks;
          const mediaStream = new MediaStream();
          
          if (tracks.audio?.persistentTrack) {
            mediaStream.addTrack(tracks.audio.persistentTrack);
          }
          if (tracks.video?.persistentTrack) {
            mediaStream.addTrack(tracks.video.persistentTrack);
          }
          
          setCallState(prev => ({ ...prev, localStream: mediaStream }));
        }
      });

      callObject.on("participant-joined", (event) => {
        if (!event || event.participant.local) return;
        console.log("[Daily] Remote participant joined");
        clearCallTimeout();
        callConnectedRef.current = true;
        callStartTimeRef.current = new Date();

        const tracks = event.participant.tracks;
        const mediaStream = new MediaStream();
        
        if (tracks.audio?.persistentTrack) {
          mediaStream.addTrack(tracks.audio.persistentTrack);
        }
        if (tracks.video?.persistentTrack) {
          mediaStream.addTrack(tracks.video.persistentTrack);
        }

        setCallState(prev => ({
          ...prev,
          remoteStream: mediaStream,
          isCalling: false,
          isCallActive: true,
          connectionStatus: 'connected',
        }));
      });

      callObject.on("participant-updated", (event?: DailyEventObjectParticipant) => {
        if (!event || event.participant.local) return;
        
        const tracks = event.participant.tracks;
        const mediaStream = new MediaStream();
        
        if (tracks.audio?.persistentTrack) {
          mediaStream.addTrack(tracks.audio.persistentTrack);
        }
        if (tracks.video?.persistentTrack) {
          mediaStream.addTrack(tracks.video.persistentTrack);
        }

        setCallState(prev => ({ ...prev, remoteStream: mediaStream }));
      });

      callObject.on("participant-left", (event) => {
        if (!event || event.participant.local) return;
        console.log("[Daily] Remote participant left");
        cleanupCall(callConnectedRef.current ? 'completed' : undefined);
      });

      callObject.on("error", (event) => {
        console.error("[Daily] Error:", event);
        toast.error("Erro na chamada. Tente novamente.");
        cleanupCall(callConnectedRef.current ? 'completed' : undefined);
      });

      callObject.on("left-meeting", () => {
        console.log("[Daily] Left meeting");
      });

      // Join the room
      await callObject.join({ url: roomUrl });

      setCallState(prev => ({
        ...prev,
        isCallActive: true,
        connectionStatus: 'connecting',
      }));

    } catch (error: any) {
      console.error("[Daily] Error joining room:", error);
      
      if (error.message?.includes("permission") || error.message?.includes("NotAllowed")) {
        toast.error("Permissão de câmera/microfone negada.");
      } else {
        toast.error("Erro ao conectar na chamada.");
      }
      
      cleanupCall();
    }
  }, [clearCallTimeout, cleanupCall]);

  // Create Daily room via edge function
  const createDailyRoom = useCallback(async (callType: CallType): Promise<string | null> => {
    try {
      console.log("[Daily] Creating room...");
      const { data, error } = await supabase.functions.invoke("create-daily-room", {
        body: { conversationId, callType },
      });

      if (error) throw error;
      if (!data?.roomUrl) throw new Error("No room URL returned");

      console.log("[Daily] Room created:", data.roomUrl);
      return data.roomUrl;
    } catch (error) {
      console.error("[Daily] Error creating room:", error);
      toast.error("Erro ao criar sala de chamada.");
      return null;
    }
  }, [conversationId]);

  const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
    console.log("[Daily] Signaling:", message.type);

    switch (message.type) {
      case "call_request":
        setCallState(prev => ({
          ...prev,
          isIncomingCall: true,
          callerInfo: message.callerInfo || null,
          callType: message.callType || 'video',
        }));

        if (document.visibilityState === 'hidden' && conversationId) {
          const callerName = message.callerInfo?.full_name ||
            message.callerInfo?.username ||
            'Alguém';
          showCallNotification(
            callerName,
            message.callType || 'video',
            conversationId,
            message.from
          );
        }
        break;

      case "call_accepted":
        // Other party accepted - create room and share URL
        const callType = callState.callType || 'video';
        const roomUrl = await createDailyRoom(callType);
        if (roomUrl) {
          roomUrlRef.current = roomUrl;
          // Send room URL to the other participant
          if (participant) {
            sendSignalingMessage({
              type: "daily_room_ready",
              to: participant.id,
              roomUrl,
              callType,
            });
          }
          // Join the room ourselves
          await joinDailyRoom(roomUrl, callType);
        } else {
          cleanupCall();
        }
        break;

      case "daily_room_ready":
        // Room is ready, join it
        if (message.roomUrl) {
          const type = message.callType || callState.callType || 'video';
          roomUrlRef.current = message.roomUrl;
          await joinDailyRoom(message.roomUrl, type);
        }
        break;

      case "call_rejected":
        toast.error("Chamada recusada");
        cleanupCall('rejected');
        break;

      case "call_ended":
        cleanupCall();
        break;
    }
  }, [callState.callType, participant, sendSignalingMessage, createDailyRoom, joinDailyRoom, cleanupCall, conversationId, showCallNotification]);

  // Initialize signaling channel
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase.channel(`video-call:${conversationId}`);

    channel
      .on("broadcast", { event: "signaling" }, ({ payload }) => {
        const message = payload as SignalingMessage;
        if (message.from === user.id) return;
        if (message.to !== user.id) return;

        handleSignalingMessage(message);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, user, handleSignalingMessage]);

  const startCall = useCallback(async (type: CallType = 'video') => {
    if (!participant || !user) return;

    console.log("[Daily] Starting", type, "call to:", participant.username);
    isInitiatorRef.current = true;

    setCallState(prev => ({ ...prev, callType: type, isCalling: true }));

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    sendSignalingMessage({
      type: "call_request",
      to: participant.id,
      callerInfo: profile || undefined,
      callType: type,
    });

    clearCallTimeout();
    callTimeoutRef.current = window.setTimeout(() => {
      console.log("[Daily] Call timeout - no answer");
      toast.error("Chamada não atendida");
      cleanupCall('no_answer');
    }, CALL_TIMEOUT_MS);
  }, [participant, user, sendSignalingMessage, clearCallTimeout, cleanupCall]);

  const acceptCall = useCallback(async () => {
    if (!callState.callerInfo) return;

    sendSignalingMessage({
      type: "call_accepted",
      to: callState.callerInfo.id,
    });

    setCallState(prev => ({ ...prev, isIncomingCall: false }));
  }, [callState.callerInfo, sendSignalingMessage]);

  const rejectCall = useCallback(() => {
    if (!callState.callerInfo) return;

    sendSignalingMessage({
      type: "call_rejected",
      to: callState.callerInfo.id,
    });

    setCallState(prev => ({
      ...prev,
      isIncomingCall: false,
      callerInfo: null,
    }));
  }, [callState.callerInfo, sendSignalingMessage]);

  const endCall = useCallback(() => {
    if (participant) {
      sendSignalingMessage({
        type: "call_ended",
        to: participant.id,
      });
    }
    cleanupCall(callConnectedRef.current ? 'completed' : undefined);
  }, [participant, sendSignalingMessage, cleanupCall]);

  const toggleVideo = useCallback(() => {
    if (dailyCallRef.current) {
      const isEnabled = callState.isVideoEnabled;
      dailyCallRef.current.setLocalVideo(!isEnabled);
      setCallState(prev => ({ ...prev, isVideoEnabled: !isEnabled }));
    }
  }, [callState.isVideoEnabled]);

  const toggleAudio = useCallback(() => {
    if (dailyCallRef.current) {
      const isEnabled = callState.isAudioEnabled;
      dailyCallRef.current.setLocalAudio(!isEnabled);
      setCallState(prev => ({ ...prev, isAudioEnabled: !isEnabled }));
    }
  }, [callState.isAudioEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dailyCallRef.current) {
        try {
          dailyCallRef.current.destroy();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  return {
    ...callState,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio,
  };
};
