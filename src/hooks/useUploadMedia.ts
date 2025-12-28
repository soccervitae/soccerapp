import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type BucketName = "post-media" | "story-media" | "avatars" | "covers" | "message-media";

export const useUploadMedia = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();

  const uploadMedia = async (
    file: File | Blob,
    bucket: BucketName,
    fileName?: string
  ): Promise<string | null> => {
    if (!user) return null;

    setIsUploading(true);
    setProgress(0);

    try {
      const fileExt = file instanceof File ? file.name.split(".").pop() : "jpg";
      const filePath = `${user.id}/${fileName || `${Date.now()}.${fileExt}`}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Erro ao fazer upload da imagem");
        throw uploadError;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      
      setProgress(100);
      return data.publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadFromUrl = async (
    url: string,
    bucket: BucketName,
    fileName?: string
  ): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return uploadMedia(blob, bucket, fileName);
    } catch (error) {
      console.error("Error fetching URL:", error);
      return null;
    }
  };

  return {
    uploadMedia,
    uploadFromUrl,
    isUploading,
    progress,
  };
};
