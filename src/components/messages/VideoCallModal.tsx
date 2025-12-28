import { useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface VideoCallModalProps {
  isOpen: boolean;
  participant: Profile | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCalling: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onEndCall: () => void;
}

export const VideoCallModal = ({
  isOpen,
  participant,
  localStream,
  remoteStream,
  isCalling,
  isVideoEnabled,
  isAudioEnabled,
  onToggleVideo,
  onToggleAudio,
  onEndCall,
}: VideoCallModalProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

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

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-full w-full h-full max-h-full p-0 bg-black border-none rounded-none [&>button]:hidden">
        <div className="relative w-full h-full flex flex-col">
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
                <Avatar className="h-24 w-24">
                  <AvatarImage src={participant?.avatar_url || ""} />
                  <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                    {getInitials(participant?.full_name || participant?.username || "?")}
                  </AvatarFallback>
                </Avatar>
                <p className="text-white text-xl font-medium">
                  {participant?.full_name || participant?.username}
                </p>
                {isCalling && (
                  <div className="flex items-center gap-2 text-white/70">
                    <Loader2 className="h-4 w-4 animate-spin" />
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
