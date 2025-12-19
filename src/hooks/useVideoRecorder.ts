import { useState, useRef, useCallback } from 'react';

export interface RecordedVideo {
  url: string;
  blob: Blob;
  duration: number;
}

export type CameraFacing = 'user' | 'environment';

export const useVideoRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<RecordedVideo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('environment');
  const [countdown, setCountdown] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  const startPreview = useCallback(async (videoElement: HTMLVideoElement, facing: CameraFacing = 'environment') => {
    try {
      setError(null);
      
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
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
      setCameraFacing(facing);

      return true;
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
      return false;
    }
  }, []);

  const switchCamera = useCallback(async () => {
    if (!videoPreviewRef.current) return;
    
    const newFacing: CameraFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    await startPreview(videoPreviewRef.current, newFacing);
  }, [cameraFacing, startPreview]);

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

      // Update timer and auto-stop at 45 seconds
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingTime(elapsed);
        
        if (elapsed >= 45) {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        }
      }, 1000);

    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError('Não foi possível iniciar a gravação');
    }
  }, []);

  const startRecordingWithCountdown = useCallback((seconds: number = 3) => {
    setCountdown(seconds);
    
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          // Start recording when countdown ends
          setTimeout(() => {
            startRecording();
          }, 100);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [startRecording]);

  const cancelCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
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
    cancelCountdown();
    setRecordingTime(0);
    setError(null);
  }, [stopRecording, stopPreview, discardVideo, cancelCountdown]);

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
    cameraFacing,
    countdown,
    startPreview,
    stopPreview,
    startRecording,
    startRecordingWithCountdown,
    cancelCountdown,
    stopRecording,
    toggleRecording,
    switchCamera,
    discardVideo,
    cleanup,
  };
};
