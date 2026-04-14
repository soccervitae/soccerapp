import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/hooks/useVideoDuration";

const MAX_DURATION = 90;
const MIN_DURATION = 3;

interface VideoTrimmerProps {
  videoUrl: string;
  videoFile?: File | Blob;
  onConfirm: (startTime: number, endTime: number) => void;
  onCancel: () => void;
}

type DragTarget = "left" | "right" | "middle" | null;

export const VideoTrimmer = ({ videoUrl, videoFile, onConfirm, onCancel }: VideoTrimmerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);
  const dragStartX = useRef(0);
  const dragStartValues = useRef({ start: 0, end: 0 });

  const trimDuration = endTime - startTime;

  const generateThumbnails = useCallback(async (videoDuration: number) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.crossOrigin = "anonymous";
    video.src = videoUrl;

    await new Promise<void>((resolve) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => resolve();
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 80;
    canvas.height = 56;

    const numThumbs = Math.min(20, Math.ceil(videoDuration / 5));
    const thumbs: string[] = [];

    for (let i = 0; i < numThumbs; i++) {
      const time = (i / numThumbs) * videoDuration;
      video.currentTime = time;
      await new Promise<void>((resolve) => {
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          thumbs.push(canvas.toDataURL("image/jpeg", 0.5));
          resolve();
        };
        setTimeout(resolve, 500);
      });
    }

    setThumbnails(thumbs);
    video.removeAttribute("src");
    video.load();
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoaded = () => {
      const dur = video.duration;
      if (dur && isFinite(dur)) {
        setDuration(dur);
        setStartTime(0);
        setEndTime(Math.min(MAX_DURATION, dur));
        setIsReady(true);
        if (dur > MAX_DURATION) {
          generateThumbnails(dur);
        }
      }
    };

    video.addEventListener("loadedmetadata", onLoaded);
    return () => video.removeEventListener("loadedmetadata", onLoaded);
  }, [generateThumbnails]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isReady) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.currentTime >= endTime) {
        video.currentTime = startTime;
        video.pause();
        setIsPlaying(false);
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [startTime, endTime, isReady]);

  useEffect(() => {
    if (isReady && duration <= MAX_DURATION) {
      onConfirm(0, duration);
    }
  }, [isReady, duration]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      if (video.currentTime < startTime || video.currentTime >= endTime) {
        video.currentTime = startTime;
      }
      video.play();
      setIsPlaying(true);
    }
  };

  const getTimeFromX = (clientX: number): number => {
    const timeline = timelineRef.current;
    if (!timeline || !duration) return 0;
    const rect = timeline.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return (x / rect.width) * duration;
  };

  const handleHandleStart = (target: DragTarget, clientX: number) => {
    setDragTarget(target);
    dragStartX.current = clientX;
    dragStartValues.current = { start: startTime, end: endTime };
  };

  const handleDragMove = useCallback((clientX: number) => {
    if (!dragTarget || !duration) return;
    const timeline = timelineRef.current;
    if (!timeline) return;

    const rect = timeline.getBoundingClientRect();
    const deltaX = clientX - dragStartX.current;
    const deltaTime = (deltaX / rect.width) * duration;
    const { start: origStart, end: origEnd } = dragStartValues.current;

    let newStart = startTime;
    let newEnd = endTime;

    if (dragTarget === "left") {
      newStart = Math.max(0, Math.min(origStart + deltaTime, endTime - MIN_DURATION));
      // Enforce max duration
      if (endTime - newStart > MAX_DURATION) {
        newStart = endTime - MAX_DURATION;
      }
      setStartTime(newStart);
      const video = videoRef.current;
      if (video) {
        video.currentTime = newStart;
        setCurrentTime(newStart);
      }
    } else if (dragTarget === "right") {
      newEnd = Math.min(duration, Math.max(origEnd + deltaTime, startTime + MIN_DURATION));
      // Enforce max duration
      if (newEnd - startTime > MAX_DURATION) {
        newEnd = startTime + MAX_DURATION;
      }
      setEndTime(newEnd);
      const video = videoRef.current;
      if (video) {
        video.currentTime = Math.max(newEnd - 1, startTime);
        setCurrentTime(video.currentTime);
      }
    } else if (dragTarget === "middle") {
      const selectionDur = origEnd - origStart;
      let newMidStart = origStart + deltaTime;
      newMidStart = Math.max(0, Math.min(newMidStart, duration - selectionDur));
      setStartTime(newMidStart);
      setEndTime(newMidStart + selectionDur);
      const video = videoRef.current;
      if (video) {
        video.currentTime = newMidStart;
        setCurrentTime(newMidStart);
      }
    }
  }, [dragTarget, duration, startTime, endTime]);

  // Left handle events
  const onLeftHandleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleHandleStart("left", e.clientX);
  };
  const onLeftHandleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    handleHandleStart("left", e.touches[0].clientX);
  };

  // Right handle events
  const onRightHandleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleHandleStart("right", e.clientX);
  };
  const onRightHandleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    handleHandleStart("right", e.touches[0].clientX);
  };

  // Middle area events
  const onMiddleMouseDown = (e: React.MouseEvent) => {
    handleHandleStart("middle", e.clientX);
  };
  const onMiddleTouchStart = (e: React.TouchEvent) => {
    handleHandleStart("middle", e.touches[0].clientX);
  };

  useEffect(() => {
    if (!dragTarget) return;

    const handleMove = (e: MouseEvent) => handleDragMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleDragMove(e.touches[0].clientX);
    };
    const handleUp = () => setDragTarget(null);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [dragTarget, handleDragMove]);

  const handleConfirm = () => {
    onConfirm(startTime, endTime);
  };

  if (isReady && duration <= MAX_DURATION) {
    return (
      <video ref={videoRef} src={videoUrl} className="hidden" preload="metadata" muted />
    );
  }

  if (!isReady) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <video ref={videoRef} src={videoUrl} className="hidden" preload="metadata" muted />
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-white/60 text-sm">Carregando vídeo...</span>
        </div>
      </div>
    );
  }

  const selectionLeftPercent = (startTime / duration) * 100;
  const selectionWidthPercent = (trimDuration / duration) * 100;
  const playheadPercent = trimDuration > 0 ? ((currentTime - startTime) / trimDuration) * 100 : 0;

  return (
    <div className="h-screen w-full bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-xl z-50">
        <button
          onClick={onCancel}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-all duration-200"
        >
          <span className="material-symbols-outlined text-[24px] text-white">close</span>
        </button>
        <span className="text-base font-semibold text-white">Cortar Vídeo</span>
        <Button
          onClick={handleConfirm}
          size="sm"
          className="px-5 font-semibold text-sm bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25 rounded"
        >
          Confirmar
        </Button>
      </div>

      {/* Video Preview */}
      <div className="flex-1 relative flex items-center justify-center bg-black min-h-0">
        <video
          ref={videoRef}
          src={videoUrl}
          className="max-w-full max-h-full object-contain"
          muted
          playsInline
          preload="auto"
        />

        <button
          onClick={handlePlayPause}
          className="absolute inset-0 flex items-center justify-center"
        >
          {!isPlaying && (
            <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-[36px] text-white">play_arrow</span>
            </div>
          )}
        </button>

        <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-full">
          <span className="text-white text-xs font-medium">
            {formatDuration(trimDuration)} / {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="bg-zinc-950 px-4 pt-4 pb-8 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">content_cut</span>
            <span className="text-xs text-white/60">
              Arraste as bordas para ajustar (máx. {MAX_DURATION}s)
            </span>
          </div>
          <span className="text-xs text-white/80 font-medium">
            {formatDuration(startTime)} - {formatDuration(endTime)}
          </span>
        </div>

        {/* Timeline with thumbnails */}
        <div
          ref={timelineRef}
          className="relative h-14 rounded-lg overflow-hidden select-none touch-none"
        >
          {/* Thumbnail strip */}
          <div className="absolute inset-0 flex">
            {thumbnails.length > 0 ? (
              thumbnails.map((thumb, i) => (
                <img
                  key={i}
                  src={thumb}
                  alt=""
                  className="h-full flex-1 object-cover"
                  draggable={false}
                />
              ))
            ) : (
              <div className="w-full h-full bg-zinc-800" />
            )}
          </div>

          {/* Dimmed areas outside selection */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-black/70"
            style={{ width: `${selectionLeftPercent}%` }}
          />
          <div
            className="absolute top-0 bottom-0 right-0 bg-black/70"
            style={{ width: `${100 - selectionLeftPercent - selectionWidthPercent}%` }}
          />

          {/* Selection window */}
          <div
            className="absolute top-0 bottom-0 border-y-2 border-primary"
            style={{
              left: `${selectionLeftPercent}%`,
              width: `${selectionWidthPercent}%`,
            }}
          >
            {/* Middle drag area */}
            <div
              className="absolute inset-0 cursor-grab active:cursor-grabbing z-[1]"
              onMouseDown={onMiddleMouseDown}
              onTouchStart={onMiddleTouchStart}
              style={{ left: 16, right: 16 }}
            />

            {/* Left handle */}
            <div
              className="absolute left-0 top-0 bottom-0 w-4 bg-primary rounded-l-md flex items-center justify-center cursor-ew-resize z-[2]"
              onMouseDown={onLeftHandleMouseDown}
              onTouchStart={onLeftHandleTouchStart}
            >
              <div className="w-0.5 h-5 bg-white/80 rounded-full" />
            </div>

            {/* Right handle */}
            <div
              className="absolute right-0 top-0 bottom-0 w-4 bg-primary rounded-r-md flex items-center justify-center cursor-ew-resize z-[2]"
              onMouseDown={onRightHandleMouseDown}
              onTouchStart={onRightHandleTouchStart}
            >
              <div className="w-0.5 h-5 bg-white/80 rounded-full" />
            </div>

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg shadow-white/30 z-10"
              style={{
                left: `${Math.max(0, Math.min(playheadPercent, 100))}%`,
              }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full" />
            </div>
          </div>
        </div>

        {/* Time markers */}
        <div className="flex justify-between px-1">
          <span className="text-[10px] text-white/40">0:00</span>
          <span className="text-[10px] text-white/40">{formatDuration(duration / 4)}</span>
          <span className="text-[10px] text-white/40">{formatDuration(duration / 2)}</span>
          <span className="text-[10px] text-white/40">{formatDuration((duration * 3) / 4)}</span>
          <span className="text-[10px] text-white/40">{formatDuration(duration)}</span>
        </div>

        <p className="text-center text-[11px] text-white/40">
          ⏱️ Máximo de {MAX_DURATION} segundos por vídeo
        </p>
      </div>
    </div>
  );
};
