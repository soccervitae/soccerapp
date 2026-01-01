import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import type { MessageWithSender } from "@/hooks/useMessages";
import type { ReactionWithUser } from "@/hooks/useMessageReactions";
import type { VideoCallMetadata } from "@/hooks/useVideoCall";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Check, CheckCheck, Play, Pause, Clock, Flame, SmilePlus, Reply, Trash2,
  Video, PhoneOff, PhoneMissed, PhoneIncoming, Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmojiReactionPicker } from "./EmojiReactionPicker";
import { AudioWaveform } from "./AudioWaveform";
import { SharedContentPreview, isSharedContentMessage, parseSharedContent } from "./SharedContentPreview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MessageBubbleProps {
  message: MessageWithSender;
  onReply?: (message: MessageWithSender) => void;
  reactions?: ReactionWithUser[];
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (reactionId: string) => void;
  onDelete?: (messageId: string) => void;
}

export const MessageBubble = ({ 
  message, 
  onReply, 
  reactions = [],
  onAddReaction,
  onRemoveReaction,
  onDelete
}: MessageBubbleProps) => {
  const { user } = useAuth();
  const isOwn = message.sender_id === user?.id;
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);


  const formatTime = (date: string) => {
    return format(new Date(date), "HH:mm", { locale: ptBR });
  };

  const isRead = message.read_by && message.read_by.length > 0;
  const isTemporary = message.is_temporary || message.delete_after_read;

  const toggleAudio = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const percent = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(percent);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatCallDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleLongPress = () => {
    setShowActionMenu(true);
  };

  const canDelete = isOwn && !isRead && !message.isPending;

  const handleReactionClick = (emoji: string, existingReaction?: ReactionWithUser) => {
    if (existingReaction && existingReaction.user_id === user?.id && onRemoveReaction) {
      onRemoveReaction(existingReaction.id);
    } else if (onAddReaction) {
      onAddReaction(message.id, emoji);
    }
  };

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, ReactionWithUser[]>);

  // Check if this is a call message (video or voice)
  const isVideoCallMessage = message.media_type === "video_call";
  const isVoiceCallMessage = message.media_type === "voice_call";
  const isCallMessage = isVideoCallMessage || isVoiceCallMessage;

  // Check if this is a shared content message
  const isSharedContent = isSharedContentMessage(message.media_type);
  const sharedContentData = isSharedContent ? parseSharedContent(message.content) : null;

  // Render call card
  if (isCallMessage) {
    let callData: VideoCallMetadata;
    try {
      callData = JSON.parse(message.content);
    } catch {
      callData = { status: 'completed' };
    }

    const isInitiator = callData.initiator === user?.id;
    const callTypeFromData = callData.callType || (isVoiceCallMessage ? 'voice' : 'video');
    const isVoice = callTypeFromData === 'voice';
    
    const getCallConfig = () => {
      const callLabel = isVoice ? 'Chamada de voz' : 'Chamada de vídeo';
      const CompletedIcon = isVoice ? Phone : Video;
      
      switch (callData.status) {
        case 'completed':
          return {
            icon: CompletedIcon,
            iconBg: 'bg-green-100 dark:bg-green-900/30',
            iconColor: 'text-green-600 dark:text-green-400',
            title: callLabel,
            subtitle: callData.duration ? formatCallDuration(callData.duration) : 'Concluída',
          };
        case 'missed':
          return {
            icon: PhoneMissed,
            iconBg: 'bg-red-100 dark:bg-red-900/30',
            iconColor: 'text-red-600 dark:text-red-400',
            title: callLabel,
            subtitle: 'Perdida',
          };
        case 'rejected':
          return {
            icon: PhoneOff,
            iconBg: 'bg-orange-100 dark:bg-orange-900/30',
            iconColor: 'text-orange-600 dark:text-orange-400',
            title: callLabel,
            subtitle: isInitiator ? 'Recusada' : 'Recusada',
          };
        case 'no_answer':
          return {
            icon: PhoneIncoming,
            iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
            iconColor: 'text-yellow-600 dark:text-yellow-400',
            title: callLabel,
            subtitle: 'Não atendida',
          };
        default:
          return {
            icon: isVoice ? Phone : Video,
            iconBg: 'bg-muted',
            iconColor: 'text-muted-foreground',
            title: callLabel,
            subtitle: '',
          };
      }
    };

    const config = getCallConfig();
    const IconComponent = config.icon;

    return (
      <div className="flex justify-center my-4">
        <div className="bg-muted/50 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center gap-3 max-w-[280px] border border-border/50">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.iconBg}`}>
            <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {config.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {config.subtitle}
            </p>
          </div>
          
          {/* Time */}
          <span className="text-[10px] text-muted-foreground self-end">
            {formatTime(message.created_at)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
      <div className="relative max-w-[80%] group/bubble">
        {/* Deletable indicator - shows on hover for unread own messages */}
        {canDelete && (
          <div className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? "-left-7" : "-right-7"} opacity-0 group-hover/bubble:opacity-50 transition-opacity pointer-events-none`}>
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`w-fit max-w-full rounded-2xl px-4 py-2 ${
            isOwn
              ? "bg-green-100 dark:bg-green-200 text-green-900 dark:text-green-900 rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md"
          } ${isTemporary ? "border-2 border-orange-500/50" : ""} ${canDelete ? "cursor-pointer" : ""}`}
          onClick={() => {
            // Click to open action menu if own message and can delete
            if (canDelete) {
              setShowActionMenu(true);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            handleLongPress();
          }}
          onDoubleClick={() => onReply?.(message)}
        >
          {/* Temporary message indicator */}
          {isTemporary && (
            <div className={`flex items-center gap-1 text-xs mb-1 ${
              isOwn ? "text-green-700" : "text-orange-500"
            }`}>
              <Flame className="h-3 w-3" />
              <span>Mensagem temporária</span>
            </div>
          )}

          {/* Reply preview */}
          {message.replyToMessage && (
            <div
              className={`text-xs mb-2 p-2 rounded-lg border-l-2 ${
                isOwn
                  ? "bg-green-200/50 dark:bg-green-300/50 border-green-500"
                  : "bg-background/50 border-primary/50"
              }`}
            >
              <p className="opacity-70 truncate">{message.replyToMessage.content}</p>
            </div>
          )}

          {/* Shared content preview */}
          {isSharedContent && sharedContentData && (
            <div className="mb-2">
              <SharedContentPreview data={sharedContentData} isOwn={isOwn} />
            </div>
          )}

          {/* Media content */}
          {message.media_url && !isSharedContent && (
            <div className="mb-2 rounded-lg overflow-hidden">
              {message.media_type === "audio" ? (
                <div className="flex items-center gap-2 min-w-[180px]">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleAudio}
                    className={`h-10 w-10 rounded-full ${
                      isOwn
                        ? "bg-green-200 hover:bg-green-300 text-green-800"
                        : "bg-background/50 hover:bg-background/70"
                    }`}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 ml-0.5" />
                    )}
                  </Button>

                  <div className="flex-1">
                    <AudioWaveform
                      isPlaying={isPlaying}
                      progress={progress}
                      seed={message.id}
                      barCount={28}
                      isOwn={isOwn}
                      onSeek={(newProgress) => {
                        if (audioRef.current?.duration) {
                          audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
                          setProgress(newProgress);
                        }
                      }}
                    />
                    <span className={`text-[10px] ${
                      isOwn ? "text-green-700" : "text-muted-foreground"
                    }`}>
                      {audioRef.current?.duration
                        ? formatDuration(isPlaying ? audioRef.current.currentTime : audioRef.current.duration)
                        : "0:00"}
                    </span>
                  </div>

                  <audio
                    ref={audioRef}
                    src={message.media_url}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleAudioEnded}
                    onLoadedMetadata={() => setProgress(0)}
                    className="hidden"
                  />
                </div>
              ) : message.media_type === "video" ? (
                <video
                  src={message.media_url}
                  controls
                  className="max-w-full rounded-lg"
                />
              ) : (
                <img
                  src={message.media_url}
                  alt="Media"
                  className="max-w-full rounded-lg"
                />
              )}
            </div>
          )}

          {/* Text content - hide emoji placeholders for audio and shared content */}
          {message.content && message.content !== "🎤" && !isSharedContent && (
            <p className="text-sm whitespace-pre-wrap break-words" style={{ overflowWrap: 'anywhere' }}>{message.content}</p>
          )}

          {/* Time and read status - WhatsApp style */}
          <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
            <span className={`text-[10px] ${isOwn ? "text-green-700" : "text-muted-foreground"}`}>
              {formatTime(message.created_at)}
            </span>
            {isOwn && (
              <motion.span 
                className="flex items-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                key={message.isPending ? 'pending' : isRead ? 'read' : 'delivered'}
              >
                {message.isPending ? (
                  <Clock className="h-3 w-3 text-green-600/70" />
                ) : isRead ? (
                  <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5 text-green-700/60" />
                )}
              </motion.span>
            )}
          </div>

          {/* Reaction button */}
          <button
            onClick={() => setShowReactionPicker(true)}
            className={`absolute -bottom-2 ${isOwn ? "left-0" : "right-0"} opacity-0 group-hover:opacity-100 hover:opacity-100 bg-card border border-border rounded-full p-1 shadow-sm transition-opacity`}
            style={{ opacity: showReactionPicker ? 0 : undefined }}
          >
            <SmilePlus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {/* Emoji picker */}
          <EmojiReactionPicker
            isOpen={showReactionPicker}
            onSelect={(emoji) => onAddReaction?.(message.id, emoji)}
            onClose={() => setShowReactionPicker(false)}
            position="top"
            isOwn={isOwn}
          />
        </div>

        {/* Reactions display */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
            {Object.entries(groupedReactions).map(([emoji, reacts]) => {
              const userReacted = reacts.find((r) => r.user_id === user?.id);
              return (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji, userReacted)}
                  className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition-colors ${
                    userReacted
                      ? "bg-primary/20 border-primary/50"
                      : "bg-muted border-border hover:bg-muted/80"
                  }`}
                >
                  <span>{emoji}</span>
                  {reacts.length > 1 && (
                    <span className="text-muted-foreground">{reacts.length}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Action menu overlay */}
        {showActionMenu && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowActionMenu(false)}
          />
        )}

        {/* Action menu */}
        {showActionMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute -top-14 ${isOwn ? "right-0" : "left-0"} bg-popover border border-border rounded-xl shadow-lg p-1 flex gap-1 z-50`}
          >
            {/* Badge showing message is unread */}
            {canDelete && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap font-medium">
                Ainda não lida
              </div>
            )}

            {/* Reagir */}
            <button
              onClick={() => {
                setShowActionMenu(false);
                setShowReactionPicker(true);
              }}
              className="p-2.5 hover:bg-muted rounded-lg transition-colors"
              title="Reagir"
            >
              <SmilePlus className="h-5 w-5 text-muted-foreground" />
            </button>
            
            {/* Responder */}
            <button
              onClick={() => {
                setShowActionMenu(false);
                onReply?.(message);
              }}
              className="p-2.5 hover:bg-muted rounded-lg transition-colors"
              title="Responder"
            >
              <Reply className="h-5 w-5 text-muted-foreground" />
            </button>
            
            {/* Apagar - só aparece se for minha mensagem E não foi lida */}
            {canDelete && (
              <button
                onClick={() => {
                  setShowActionMenu(false);
                  setShowDeleteConfirm(true);
                }}
                className="p-2.5 hover:bg-destructive/10 rounded-lg transition-colors"
                title="Apagar para todos"
              >
                <Trash2 className="h-5 w-5 text-destructive" />
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar mensagem?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta mensagem será apagada para todos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete?.(message.id)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
