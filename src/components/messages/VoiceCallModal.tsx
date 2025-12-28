import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MicOff, PhoneOff, Volume2, Wifi, WifiOff } from "lucide-react";
import { useDialTone } from "@/hooks/useDialTone";
import type { Database } from "@/integrations/supabase/types";
import type { ConnectionStatus } from "@/hooks/useVideoCall";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface VoiceCallModalProps {
  isOpen: boolean;
  participant: Profile | null;
  remoteStream: MediaStream | null;
  isCalling: boolean;
  isAudioEnabled: boolean;
  connectionStatus: ConnectionStatus;
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

export const VoiceCallModal = ({
  isOpen,
  participant,
  remoteStream,
  isCalling,
  isAudioEnabled,
  connectionStatus,
  onToggleAudio,
  onEndCall,
}: VoiceCallModalProps) => {
  const [callDuration, setCallDuration] = useState(0);
  const callStartTimeRef = useState<number | null>(null);

  // Play dial tone while waiting for answer
  const isWaitingForAnswer = isCalling && !remoteStream;
  useDialTone(isWaitingForAnswer);

  // Call duration timer
  useEffect(() => {
    let interval: number | null = null;
    let startTime = callStartTimeRef[0];
    
    if (remoteStream) {
      if (!startTime) {
        startTime = Date.now();
        callStartTimeRef[1](startTime);
      }
      
      interval = window.setInterval(() => {
        if (startTime) {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          setCallDuration(elapsed);
        }
      }, 1000);
    } else {
      callStartTimeRef[1](null);
      setCallDuration(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [remoteStream]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      callStartTimeRef[1](null);
      setCallDuration(0);
    }
  }, [isOpen]);

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
      <DialogContent className="max-w-full w-full h-full max-h-full p-0 bg-gradient-to-b from-zinc-900 to-black border-none rounded-none [&>button]:hidden">
        <div className="relative w-full h-full flex flex-col items-center justify-center">
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

          {/* Main content */}
          <div className="flex flex-col items-center gap-8">
            {/* Avatar with audio animation */}
            <div className="relative">
              {/* Pulsing rings for calling/connected state */}
              {(isCalling || remoteStream) && (
                <>
                  <div 
                    className={`absolute inset-0 rounded-full ${remoteStream ? 'bg-green-500/20' : 'bg-primary/20'} animate-ping`} 
                    style={{ animationDuration: '1.5s' }} 
                  />
                  <div 
                    className={`absolute -inset-3 rounded-full border-2 ${remoteStream ? 'border-green-500/30' : 'border-primary/30'} animate-pulse`} 
                  />
                  <div 
                    className={`absolute -inset-6 rounded-full border ${remoteStream ? 'border-green-500/20' : 'border-primary/20'} animate-pulse`} 
                    style={{ animationDelay: '0.5s' }} 
                  />
                </>
              )}
              <Avatar className="h-32 w-32 relative z-10 border-4 border-white/10">
                <AvatarImage src={participant?.avatar_url || ""} />
                <AvatarFallback className="text-3xl bg-primary/30 text-primary">
                  {getInitials(participant?.full_name || participant?.username || "?")}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Name and status */}
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-white mb-2">
                {participant?.full_name || participant?.username}
              </h2>
              {isCalling && !remoteStream ? (
                <div className="flex items-center justify-center gap-2 text-white/70">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>Chamando...</span>
                </div>
              ) : remoteStream ? (
                <p className="text-white/70 text-lg">
                  {formatDuration(callDuration)}
                </p>
              ) : null}
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-6 px-4">
            {/* Mute button */}
            <div className="flex flex-col items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className={`h-16 w-16 rounded-full border-2 ${
                  isAudioEnabled
                    ? "bg-white/10 border-white/30 hover:bg-white/20"
                    : "bg-red-500 border-red-500 hover:bg-red-600"
                }`}
                onClick={onToggleAudio}
              >
                {isAudioEnabled ? (
                  <Mic className="h-7 w-7 text-white" />
                ) : (
                  <MicOff className="h-7 w-7 text-white" />
                )}
              </Button>
              <span className="text-white/70 text-sm">
                {isAudioEnabled ? "Mudo" : "Ativar"}
              </span>
            </div>

            {/* End call button */}
            <div className="flex flex-col items-center gap-2">
              <Button
                variant="destructive"
                size="icon"
                className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 border-none"
                onClick={onEndCall}
              >
                <PhoneOff className="h-7 w-7" />
              </Button>
              <span className="text-white/70 text-sm">Encerrar</span>
            </div>

            {/* Speaker button (visual only for now) */}
            <div className="flex flex-col items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-16 w-16 rounded-full border-2 bg-white/10 border-white/30 hover:bg-white/20"
              >
                <Volume2 className="h-7 w-7 text-white" />
              </Button>
              <span className="text-white/70 text-sm">Alto-falante</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
