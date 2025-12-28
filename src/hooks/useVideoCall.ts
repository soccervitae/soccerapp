import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

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
  }, [conversationId, user]);

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

  const handleSignalingMessage = async (message: SignalingMessage) => {
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
        await cleanupCall();
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
        await cleanupCall();
        break;
    }
  };

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && participant) {
        sendSignalingMessage({
          type: "ice_candidate",
          to: participant.id,
          payload: event.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (event) => {
      console.log("Remote track received");
      setCallState((prev) => ({
        ...prev,
        remoteStream: event.streams[0],
      }));
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
      if (pc.iceConnectionState === "connected") {
        setCallState((prev) => ({ ...prev, isCalling: false, isCallActive: true }));
      } else if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        cleanupCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [participant, sendSignalingMessage]);

  const getLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setCallState((prev) => ({ ...prev, localStream: stream }));
      return stream;
    } catch (error) {
      console.error("Error getting local stream:", error);
      throw error;
    }
  };

  const createOffer = async () => {
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
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
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
  };

  const startCall = useCallback(async () => {
    if (!participant || !user) return;

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
  }, [participant, user, sendSignalingMessage]);

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
  }, [participant, sendSignalingMessage]);

  const cleanupCall = async () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
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
  };

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
