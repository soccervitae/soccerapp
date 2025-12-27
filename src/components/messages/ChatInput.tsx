import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUploadMedia } from "@/hooks/useUploadMedia";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { ImagePlus, Send, X, Loader2, Mic, Square, Trash2, Play, Pause, Flame } from "lucide-react";
import type { MessageWithSender } from "@/hooks/useMessages";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (content: string, mediaUrl?: string, mediaType?: string, replyToMessageId?: string, isTemporary?: boolean) => void;
  isSending: boolean;
  replyTo?: MessageWithSender | null;
  onCancelReply?: () => void;
  onTyping?: () => void;
}

export const ChatInput = ({ onSend, isSending, replyTo, onCancelReply, onTyping }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: string; file: File } | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isTemporaryMode, setIsTemporaryMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const { uploadMedia, isUploading } = useUploadMedia();
  const {
    isRecording,
    recordedAudio,
    formattedTime,
    startRecording,
    stopRecording,
    cancelRecording,
    discardAudio,
  } = useAudioRecorder();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type = file.type.startsWith("video/") ? "video" : "image";
    const url = URL.createObjectURL(file);
    setMediaPreview({ url, type, file });
  };

  const handleSend = async () => {
    if ((!message.trim() && !mediaPreview && !recordedAudio) || isSending || isUploading) return;

    let mediaUrl: string | undefined;
    let mediaType: string | undefined;

    if (recordedAudio) {
      const uploadedUrl = await uploadMedia(recordedAudio.blob, "message-media", `voice_${Date.now()}.webm`);
      if (uploadedUrl) {
        mediaUrl = uploadedUrl;
        mediaType = "audio";
      }
      discardAudio();
    } else if (mediaPreview) {
      const uploadedUrl = await uploadMedia(mediaPreview.file, "message-media");
      if (uploadedUrl) {
        mediaUrl = uploadedUrl;
        mediaType = mediaPreview.type;
      }
      URL.revokeObjectURL(mediaPreview.url);
      setMediaPreview(null);
    }

    onSend(message.trim() || (mediaType === "audio" ? "🎤" : "📷"), mediaUrl, mediaType, replyTo?.id, isTemporaryMode);
    setMessage("");
    if (onCancelReply) onCancelReply();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const removeMedia = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview.url);
      setMediaPreview(null);
    }
  };

  const toggleAudioPreview = () => {
    if (!audioPreviewRef.current) return;
    
    if (isPlayingPreview) {
      audioPreviewRef.current.pause();
    } else {
      audioPreviewRef.current.play();
    }
    setIsPlayingPreview(!isPlayingPreview);
  };

  const handleAudioEnded = () => {
    setIsPlayingPreview(false);
  };

  // Recording mode UI
  if (isRecording) {
    return (
      <div className="border-t border-border bg-background p-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={cancelRecording}
            className="text-destructive"
          >
            <Trash2 className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
            <span className="font-mono text-lg">{formattedTime}</span>
          </div>

          <Button
            variant="default"
            size="icon"
            onClick={stopRecording}
          >
            <Square className="h-4 w-4 fill-current" />
          </Button>
        </div>
      </div>
    );
  }

  // Audio preview mode UI
  if (recordedAudio) {
    return (
      <div className="border-t border-border bg-background p-3">
        {/* Temporary mode indicator */}
        {isTemporaryMode && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-orange-500">Mensagem temporária ativada</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsTemporaryMode(false)}
              className="h-5 w-5 ml-auto"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {replyTo && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-lg">
            <div className="flex-1 text-sm text-muted-foreground truncate">
              <span className="font-medium text-foreground">
                Respondendo a {replyTo.sender?.full_name || replyTo.sender?.username}
              </span>
              <p className="truncate">{replyTo.content}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancelReply} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={discardAudio}
            className="text-destructive flex-shrink-0"
          >
            <Trash2 className="h-5 w-5" />
          </Button>

          <div className="flex-1 flex items-center gap-2 bg-muted rounded-full px-3 py-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAudioPreview}
              className="h-8 w-8"
            >
              {isPlayingPreview ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-primary w-full" />
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {Math.floor(recordedAudio.duration)}s
            </span>
          </div>

          <audio
            ref={audioPreviewRef}
            src={recordedAudio.url}
            onEnded={handleAudioEnded}
            className="hidden"
          />

          <Button
            onClick={handleSend}
            disabled={isSending || isUploading}
            size="icon"
            className="flex-shrink-0"
          >
            {isSending || isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-background p-3">
      {/* Temporary mode indicator */}
      {isTemporaryMode && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="text-sm text-orange-500">Mensagem temporária - desaparece após leitura</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsTemporaryMode(false)}
            className="h-5 w-5 ml-auto"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-lg">
          <div className="flex-1 text-sm text-muted-foreground truncate">
            <span className="font-medium text-foreground">
              Respondendo a {replyTo.sender?.full_name || replyTo.sender?.username}
            </span>
            <p className="truncate">{replyTo.content}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancelReply} className="h-6 w-6">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Media preview */}
      {mediaPreview && (
        <div className="relative inline-block mb-2">
          {mediaPreview.type === "video" ? (
            <video src={mediaPreview.url} className="h-20 rounded-lg" />
          ) : (
            <img src={mediaPreview.url} alt="Preview" className="h-20 rounded-lg" />
          )}
          <Button
            variant="destructive"
            size="icon"
            onClick={removeMedia}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,video/*"
          className="hidden"
        />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-shrink-0"
        >
          <ImagePlus className="h-5 w-5" />
        </Button>

        {/* Temporary message toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsTemporaryMode(!isTemporaryMode)}
          className={cn(
            "flex-shrink-0 transition-colors",
            isTemporaryMode && "text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 hover:text-orange-500"
          )}
          title="Mensagem temporária"
        >
          <Flame className="h-5 w-5" />
        </Button>

        <Textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            onTyping?.();
          }}
          onKeyDown={handleKeyDown}
          placeholder={isTemporaryMode ? "Mensagem temporária..." : "Digite uma mensagem..."}
          className={cn(
            "min-h-[44px] max-h-32 resize-none",
            isTemporaryMode && "border-orange-500/30 focus-visible:ring-orange-500/50"
          )}
          rows={1}
        />

        {!message.trim() && !mediaPreview ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={startRecording}
            className="flex-shrink-0"
          >
            <Mic className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            onClick={handleSend}
            disabled={(!message.trim() && !mediaPreview) || isSending || isUploading}
            size="icon"
            className="flex-shrink-0"
          >
            {isSending || isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
