import { useState, useRef, useCallback } from 'react';

export interface RecordedVideo {
  url: string;
  blob: Blob;
  duration: number;
}

export const useVideoRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<RecordedVideo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  const startPreview = useCallback(async (videoElement: HTMLVideoElement) => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: true,
      });

      streamRef.current = stream;
      videoPreviewRef.current = videoElement;
      videoElement.srcObject = stream;
      videoElement.muted = true;
      await videoElement.play();
      setIsPreviewing(true);

      return true;
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
      return false;
    }
  }, []);

  const stopPreview = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
    setIsPreviewing(false);
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      setError('Câmera não inicializada');
      return;
    }

    try {
      chunksRef.current = [];
      
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType,
        videoBitsPerSecond: 2500000,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const duration = (Date.now() - startTimeRef.current) / 1000;
        
        setRecordedVideo({ url, blob, duration });
        setIsRecording(false);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error);
        setError('Erro durante a gravação');
        setIsRecording(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      startTimeRef.current = Date.now();
      setRecordingTime(0);
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);

      // Update timer
      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError('Não foi possível iniciar a gravação');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const discardVideo = useCallback(() => {
    if (recordedVideo?.url) {
      URL.revokeObjectURL(recordedVideo.url);
    }
    setRecordedVideo(null);
    setRecordingTime(0);
  }, [recordedVideo]);

  const cleanup = useCallback(() => {
    stopRecording();
    stopPreview();
    discardVideo();
    setRecordingTime(0);
    setError(null);
  }, [stopRecording, stopPreview, discardVideo]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isRecording,
    isPreviewing,
    recordedVideo,
    recordingTime,
    formattedTime: formatTime(recordingTime),
    error,
    startPreview,
    stopPreview,
    startRecording,
    stopRecording,
    toggleRecording,
    discardVideo,
    cleanup,
  };
};
