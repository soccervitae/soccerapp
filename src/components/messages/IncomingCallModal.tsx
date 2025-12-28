import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, PhoneOff, Video } from "lucide-react";
import { motion } from "framer-motion";
import { useRingtone } from "@/hooks/useRingtone";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface IncomingCallModalProps {
  isOpen: boolean;
  caller: Profile | null;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallModal = ({
  isOpen,
  caller,
  onAccept,
  onReject,
}: IncomingCallModalProps) => {
  // Play ringtone while modal is open
  useRingtone(isOpen);
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
      <DialogContent className="sm:max-w-md bg-background border-border [&>button]:hidden">
        <div className="flex flex-col items-center gap-6 py-6">
          {/* Animated ring effect */}
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/30"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
            <Avatar className="h-24 w-24 relative z-10">
              <AvatarImage src={caller?.avatar_url || ""} />
              <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                {getInitials(caller?.full_name || caller?.username || "?")}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Caller info */}
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">
              {caller?.full_name || caller?.username}
            </h2>
            <div className="flex items-center justify-center gap-2 text-muted-foreground mt-1">
              <Video className="h-4 w-4" />
              <span>Videochamada recebida</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <Button
                variant="destructive"
                size="icon"
                className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600"
                onClick={onReject}
              >
                <PhoneOff className="h-7 w-7" />
              </Button>
              <span className="text-sm text-muted-foreground">Recusar</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Button
                size="icon"
                className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600"
                onClick={onAccept}
              >
                <Phone className="h-7 w-7" />
              </Button>
              <span className="text-sm text-muted-foreground">Aceitar</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
