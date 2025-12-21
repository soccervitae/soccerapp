import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUploadMedia } from "@/hooks/useUploadMedia";
import { ImagePlus, Send, X, Loader2 } from "lucide-react";
import type { MessageWithSender } from "@/hooks/useMessages";

interface ChatInputProps {
  onSend: (content: string, mediaUrl?: string, mediaType?: string, replyToMessageId?: string) => void;
  isSending: boolean;
  replyTo?: MessageWithSender | null;
  onCancelReply?: () => void;
}

export const ChatInput = ({ onSend, isSending, replyTo, onCancelReply }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: string; file: File } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadMedia, isUploading } = useUploadMedia();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type = file.type.startsWith("video/") ? "video" : "image";
    const url = URL.createObjectURL(file);
    setMediaPreview({ url, type, file });
  };

  const handleSend = async () => {
    if ((!message.trim() && !mediaPreview) || isSending || isUploading) return;

    let mediaUrl: string | undefined;
    let mediaType: string | undefined;

    if (mediaPreview) {
      const uploadedUrl = await uploadMedia(mediaPreview.file, "message-media");
      if (uploadedUrl) {
        mediaUrl = uploadedUrl;
        mediaType = mediaPreview.type;
      }
      URL.revokeObjectURL(mediaPreview.url);
      setMediaPreview(null);
    }

    onSend(message.trim() || "📷", mediaUrl, mediaType, replyTo?.id);
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

  return (
    <div className="border-t border-border bg-background p-3">
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

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem..."
          className="min-h-[44px] max-h-32 resize-none"
          rows={1}
        />

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
      </div>
    </div>
  );
};
