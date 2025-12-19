import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useVideoRecorder } from "@/hooks/useVideoRecorder";

interface VideoRecorderProps {
  onVideoRecorded: (videoUrl: string, blob: Blob) => void;
  onClose: () => void;
}

export const VideoRecorder = ({ onVideoRecorded, onClose }: VideoRecorderProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    isRecording,
    isPreviewing,
    recordedVideo,
    formattedTime,
    error,
    startPreview,
    stopPreview,
    toggleRecording,
    discardVideo,
    cleanup,
  } = useVideoRecorder();

  useEffect(() => {
    if (videoRef.current) {
      startPreview(videoRef.current);
    }

    return () => {
      cleanup();
    };
  }, []);

  const handleSaveVideo = () => {
    if (recordedVideo) {
      onVideoRecorded(recordedVideo.url, recordedVideo.blob);
    }
  };

  const handleRetake = () => {
    discardVideo();
    if (videoRef.current) {
      startPreview(videoRef.current);
    }
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pt-6">
        <button 
          onClick={handleClose}
          className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-[24px] text-white">close</span>
        </button>

        {isRecording && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/90 backdrop-blur-sm rounded-full">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <span className="text-white font-semibold text-sm">{formattedTime}</span>
          </div>
        )}

        <button className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px] text-white">flip_camera_ios</span>
        </button>
      </div>

      {/* Video Preview / Recording */}
      <div className="flex-1 relative">
        {!recordedVideo ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
        ) : (
          <video
            src={recordedVideo.url}
            className="w-full h-full object-cover"
            playsInline
            controls
            autoPlay
            loop
          />
        )}

        {/* Error message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center p-6">
              <span className="material-symbols-outlined text-[48px] text-red-400 mb-4">error</span>
              <p className="text-white text-sm">{error}</p>
              <Button onClick={handleClose} variant="outline" className="mt-4">
                Fechar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pb-10 bg-gradient-to-t from-black/80 to-transparent">
        {!recordedVideo ? (
          <div className="flex items-center justify-center gap-8">
            {/* Gallery button */}
            <button className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/30">
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] text-white">photo_library</span>
              </div>
            </button>

            {/* Record button */}
            <button
              onClick={toggleRecording}
              disabled={!isPreviewing}
              className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all duration-200 ${
                isRecording ? 'bg-transparent' : 'bg-transparent hover:bg-white/10'
              } disabled:opacity-50`}
            >
              <div className={`transition-all duration-200 ${
                isRecording 
                  ? 'w-8 h-8 bg-red-500 rounded-md' 
                  : 'w-16 h-16 bg-red-500 rounded-full'
              }`} />
            </button>

            {/* Effects button */}
            <button className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px] text-white">auto_awesome</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={handleRetake}
              variant="outline"
              className="flex-1 max-w-[150px] h-12 rounded-full border-white/30 text-white bg-white/10 hover:bg-white/20"
            >
              <span className="material-symbols-outlined text-[20px] mr-2">refresh</span>
              Refazer
            </Button>
            <Button
              onClick={handleSaveVideo}
              className="flex-1 max-w-[150px] h-12 rounded-full bg-primary hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-[20px] mr-2">check</span>
              Usar vídeo
            </Button>
          </div>
        )}

        {/* Recording instructions */}
        {!recordedVideo && !isRecording && isPreviewing && (
          <p className="text-center text-white/60 text-xs mt-4">
            Toque para gravar • Segure para gravar continuamente
          </p>
        )}

        {/* Max duration warning */}
        {isRecording && (
          <p className="text-center text-white/60 text-xs mt-4">
            Máximo 60 segundos
          </p>
        )}
      </div>
    </div>
  );
};
