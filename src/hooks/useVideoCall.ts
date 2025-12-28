import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface CallState {
  isCallActive: boolean;
  isIncomingCall: boolean;
  isCalling: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callerInfo: Profile | null;
}

interface SignalingMessage {
  type: "call_request" | "call_accepted" | "call_rejected" | "offer" | "answer" | "ice_candidate" | "call_ended";
  from: string;
  to: string;
  payload?: RTCSessionDescriptionInit | RTCIceCandidateInit | null;
  callerInfo?: Profile;
}

// ICE servers with TURN for NAT traversal
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    // TURN servers for NAT traversal when STUN fails
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
};

const CALL_TIMEOUT_MS = 30000; // 30 seconds timeout

export const useVideoCall = (conversationId: string | null, participant: Profile | null) => {
  const { user } = useAuth();
  const [callState, setCallState] = useState<CallState>({
    isCallActive: false,
    isIncomingCall: false,
    isCalling: false,
    isVideoEnabled: true,
    isAudioEnabled: true,
    localStream: null,
    remoteStream: null,
    callerInfo: null,
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const callTimeoutRef = useRef<number | null>(null);

  // Define cleanupCall first since it's used by other functions
  const cleanupCall = useCallback(() => {
    console.log("[WebRTC] Cleaning up call...");
    
    // Clear timeout
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        console.log("[WebRTC] Stopping track:", track.kind);
        track.stop();
      });
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      console.log("[WebRTC] Closing peer connection");
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear pending candidates
    pendingCandidatesRef.current = [];

    setCallState({
      isCallActive: false,
      isIncomingCall: false,
      isCalling: false,
      isVideoEnabled: true,
      isAudioEnabled: true,
      localStream: null,
      remoteStream: null,
      callerInfo: null,
    });
  }, []);

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

  const createPeerConnection = useCallback(() => {
    console.log("[WebRTC] Creating peer connection with ICE servers:", ICE_SERVERS);
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && participant) {
        console.log("[WebRTC] Sending ICE candidate:", event.candidate.type);
        sendSignalingMessage({
          type: "ice_candidate",
          to: participant.id,
          payload: event.candidate.toJSON(),
        });
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log("[WebRTC] ICE gathering state:", pc.iceGatheringState);
    };

    pc.ontrack = (event) => {
      console.log("[WebRTC] Remote track received:", event.track.kind);
      clearCallTimeout();
      setCallState((prev) => ({
        ...prev,
        remoteStream: event.streams[0],
      }));
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC] ICE connection state:", pc.iceConnectionState);
      console.log("[WebRTC] Connection state:", pc.connectionState);
      console.log("[WebRTC] Signaling state:", pc.signalingState);
      
      if (pc.iceConnectionState === "connected") {
        clearCallTimeout();
        setCallState((prev) => ({ ...prev, isCalling: false, isCallActive: true }));
      } else if (pc.iceConnectionState === "disconnected") {
        console.log("[WebRTC] Connection disconnected, attempting to recover...");
        toast.error("Conexão perdida. Tentando reconectar...");
      } else if (pc.iceConnectionState === "failed") {
        console.log("[WebRTC] Connection failed");
        toast.error("Falha na conexão. Tente novamente.");
        cleanupCall();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state changed:", pc.connectionState);
      if (pc.connectionState === "failed") {
        toast.error("Conexão falhou");
        cleanupCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [participant, sendSignalingMessage, clearCallTimeout, cleanupCall]);

  const getLocalStream = useCallback(async () => {
    try {
      console.log("[WebRTC] Requesting media permissions...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log("[WebRTC] Got local stream with tracks:", stream.getTracks().map(t => t.kind));
      localStreamRef.current = stream;
      setCallState((prev) => ({ ...prev, localStream: stream }));
      return stream;
    } catch (error: any) {
      console.error("[WebRTC] Error getting local stream:", error);
      
      if (error.name === "NotAllowedError") {
        toast.error("Permissão de câmera/microfone negada. Por favor, permita o acesso nas configurações do navegador.");
      } else if (error.name === "NotFoundError") {
        toast.error("Câmera ou microfone não encontrado no dispositivo.");
      } else if (error.name === "NotReadableError") {
        toast.error("Câmera ou microfone já está em uso por outro aplicativo.");
      } else {
        toast.error("Erro ao acessar câmera/microfone.");
      }
      
      cleanupCall();
      throw error;
    }
  }, [cleanupCall]);

  const createOffer = useCallback(async () => {
    const pc = createPeerConnection();
    const stream = await getLocalStream();

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    if (participant) {
      sendSignalingMessage({
        type: "offer",
        to: participant.id,
        payload: offer,
      });
    }

    setCallState((prev) => ({ ...prev, isCalling: true, isCallActive: true }));
  }, [createPeerConnection, getLocalStream, participant, sendSignalingMessage]);

  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    const pc = createPeerConnection();
    const stream = await getLocalStream();

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    
    // Add any pending ICE candidates
    for (const candidate of pendingCandidatesRef.current) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    pendingCandidatesRef.current = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (participant) {
      sendSignalingMessage({
        type: "answer",
        to: participant.id,
        payload: answer,
      });
    }

    setCallState((prev) => ({ ...prev, isCallActive: true, isIncomingCall: false }));
  }, [createPeerConnection, getLocalStream, participant, sendSignalingMessage]);

  const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
    console.log("Handling signaling:", message.type);

    switch (message.type) {
      case "call_request":
        setCallState((prev) => ({
          ...prev,
          isIncomingCall: true,
          callerInfo: message.callerInfo || null,
        }));
        break;

      case "call_accepted":
        await createOffer();
        break;

      case "call_rejected":
        cleanupCall();
        break;

      case "offer":
        if (message.payload) {
          await handleOffer(message.payload as RTCSessionDescriptionInit);
        }
        break;

      case "answer":
        if (message.payload && peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(message.payload as RTCSessionDescriptionInit)
          );
          // Add any pending ICE candidates
          for (const candidate of pendingCandidatesRef.current) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingCandidatesRef.current = [];
        }
        break;

      case "ice_candidate":
        if (message.payload) {
          if (peerConnectionRef.current?.remoteDescription) {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(message.payload as RTCIceCandidateInit)
            );
          } else {
            // Queue the candidate for later
            pendingCandidatesRef.current.push(message.payload as RTCIceCandidateInit);
          }
        }
        break;

      case "call_ended":
        cleanupCall();
        break;
    }
  }, [createOffer, handleOffer, cleanupCall]);

  // Initialize signaling channel
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase.channel(`video-call:${conversationId}`);

    channel
      .on("broadcast", { event: "signaling" }, ({ payload }) => {
        const message = payload as SignalingMessage;
        
        // Ignore messages from ourselves
        if (message.from === user.id) return;
        
        // Only process messages meant for us
        if (message.to !== user.id) return;

        console.log("Received signaling message:", message.type);
        handleSignalingMessage(message);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, user, handleSignalingMessage]);

  const startCall = useCallback(async () => {
    if (!participant || !user) return;

    console.log("[WebRTC] Starting call to:", participant.username);

    // Fetch current user's profile for caller info
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    sendSignalingMessage({
      type: "call_request",
      to: participant.id,
      callerInfo: profile || undefined,
    });

    setCallState((prev) => ({ ...prev, isCalling: true }));

    // Set timeout for unanswered call
    clearCallTimeout();
    callTimeoutRef.current = window.setTimeout(() => {
      console.log("[WebRTC] Call timeout - no answer");
      toast.error("Chamada não atendida");
      cleanupCall();
    }, CALL_TIMEOUT_MS);
  }, [participant, user, sendSignalingMessage, clearCallTimeout, cleanupCall]);

  const acceptCall = useCallback(async () => {
    if (!callState.callerInfo) return;

    sendSignalingMessage({
      type: "call_accepted",
      to: callState.callerInfo.id,
    });

    setCallState((prev) => ({ ...prev, isIncomingCall: false }));
  }, [callState.callerInfo, sendSignalingMessage]);

  const rejectCall = useCallback(() => {
    if (!callState.callerInfo) return;

    sendSignalingMessage({
      type: "call_rejected",
      to: callState.callerInfo.id,
    });

    setCallState((prev) => ({
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
    cleanupCall();
  }, [participant, sendSignalingMessage, cleanupCall]);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState((prev) => ({ ...prev, isVideoEnabled: videoTrack.enabled }));
      }
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState((prev) => ({ ...prev, isAudioEnabled: audioTrack.enabled }));
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

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
