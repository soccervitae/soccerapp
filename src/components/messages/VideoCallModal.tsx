import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Wifi, WifiOff } from "lucide-react";
import { useDialTone } from "@/hooks/useDialTone";
import type { Database } from "@/integrations/supabase/types";
import type { ConnectionStatus } from "@/hooks/useVideoCall";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface VideoCallModalProps {
  isOpen: boolean;
  participant: Profile | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCalling: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  connectionStatus: ConnectionStatus;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onEndCall: () => void;
}

const getStatusConfig = (status: ConnectionStatus) => {
  switch (status) {
    case 'connecting':
      return { color: 'bg-yellow-500', text: 'Conectando...', pulse: true, icon: Wifi };
    case 'connected':
      return { color: 'bg-green-500', text: 'Conectado', pulse: true, icon: Wifi };
    case 'reconnecting':
      return { color: 'bg-orange-500', text: 'Reconectando...', pulse: true, icon: Wifi };
    case 'failed':
      return { color: 'bg-red-500', text: 'Falha na conexão', pulse: false, icon: WifiOff };
    default:
      return { color: 'bg-zinc-500', text: '', pulse: false, icon: Wifi };
  }
};

export const VideoCallModal = ({
  isOpen,
  participant,
  localStream,
  remoteStream,
  isCalling,
  isVideoEnabled,
  isAudioEnabled,
  connectionStatus,
  onToggleVideo,
  onToggleAudio,
  onEndCall,
}: VideoCallModalProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  // Play dial tone while waiting for answer (calling but no remote stream yet)
  const isWaitingForAnswer = isCalling && !remoteStream;
  useDialTone(isWaitingForAnswer);

  // Call duration timer
  useEffect(() => {
    let interval: number | null = null;
    
    if (remoteStream) {
      if (!callStartTimeRef.current) {
        callStartTimeRef.current = Date.now();
      }
      
      interval = window.setInterval(() => {
        if (callStartTimeRef.current) {
          const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
          setCallDuration(elapsed);
        }
      }, 1000);
    } else {
      callStartTimeRef.current = null;
      setCallDuration(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [remoteStream]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      callStartTimeRef.current = null;
      setCallDuration(0);
    }
  }, [isOpen]);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-full w-full h-full max-h-full p-0 bg-black border-none rounded-none [&>button]:hidden">
        <div className="relative w-full h-full flex flex-col">
          {/* Connection status indicator */}
          {(connectionStatus !== 'idle' || remoteStream) && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
              {(() => {
                const config = getStatusConfig(connectionStatus);
                const StatusIcon = config.icon;
                return (
                  <>
                    <div className={`w-2 h-2 ${config.color} rounded-full ${config.pulse ? 'animate-pulse' : ''}`} />
                    <StatusIcon className="h-4 w-4 text-white/80" />
                    {remoteStream && connectionStatus === 'connected' ? (
                      <span className="text-white text-sm font-medium">
                        {formatDuration(callDuration)}
                      </span>
                    ) : (
                      <span className="text-white text-sm font-medium">
                        {config.text}
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Remote video (full screen) */}
          <div className="flex-1 relative bg-zinc-900">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                {/* Pulsing indicator around avatar */}
                <div className="relative">
                  {isCalling && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '1.5s' }} />
                      <div className="absolute -inset-2 rounded-full border-2 border-primary/50 animate-pulse" />
                      <div className="absolute -inset-4 rounded-full border border-primary/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
                    </>
                  )}
                  <Avatar className="h-24 w-24 relative z-10">
                    <AvatarImage src={participant?.avatar_url || ""} />
                    <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                      {getInitials(participant?.full_name || participant?.username || "?")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <p className="text-white text-xl font-medium">
                  {participant?.full_name || participant?.username}
                </p>
                {isCalling && (
                  <div className="flex items-center gap-2 text-white/70">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>Chamando...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Local video (PiP - picture in picture) */}
          <div className="absolute top-4 right-4 w-32 h-44 rounded-xl overflow-hidden bg-zinc-800 shadow-lg border border-white/10">
            {localStream && isVideoEnabled ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
                style={{ transform: "scaleX(-1)" }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <VideoOff className="h-8 w-8 text-white/50" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 px-4">
            <Button
              variant="outline"
              size="icon"
              className={`h-14 w-14 rounded-full border-2 ${
                isAudioEnabled
                  ? "bg-white/10 border-white/30 hover:bg-white/20"
                  : "bg-red-500 border-red-500 hover:bg-red-600"
              }`}
              onClick={onToggleAudio}
            >
              {isAudioEnabled ? (
                <Mic className="h-6 w-6 text-white" />
              ) : (
                <MicOff className="h-6 w-6 text-white" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              className={`h-14 w-14 rounded-full border-2 ${
                isVideoEnabled
                  ? "bg-white/10 border-white/30 hover:bg-white/20"
                  : "bg-red-500 border-red-500 hover:bg-red-600"
              }`}
              onClick={onToggleVideo}
            >
              {isVideoEnabled ? (
                <Video className="h-6 w-6 text-white" />
              ) : (
                <VideoOff className="h-6 w-6 text-white" />
              )}
            </Button>

            <Button
              variant="destructive"
              size="icon"
              className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 border-none"
              onClick={onEndCall}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
