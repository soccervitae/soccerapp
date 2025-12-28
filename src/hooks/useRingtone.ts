import { useEffect, useRef, useCallback } from "react";

export const useRingtone = (isPlaying: boolean) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);

  const playWebAudioRingtone = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") return;
    
    const ctx = audioContextRef.current;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    // First beep - 440Hz
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = 440;
    osc1.connect(gain);

    // Fade in/out for smoother sound - higher volume
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.4);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.5);

    // Second beep - slightly higher pitch for ring pattern
    setTimeout(() => {
      if (!audioContextRef.current || audioContextRef.current.state === "closed") return;
      
      const gain2 = ctx.createGain();
      gain2.connect(ctx.destination);

      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.value = 480;
      osc2.connect(gain2);

      gain2.gain.setValueAtTime(0, ctx.currentTime);
      gain2.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gain2.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.4);
      gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.5);
    }, 600);
  }, []);

  const startRingtone = useCallback(() => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;

    // Create AudioContext
    audioContextRef.current = new AudioContext();
    
    // Resume AudioContext if suspended (required for autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    // Play immediately and then loop
    playWebAudioRingtone();
    intervalRef.current = window.setInterval(() => {
      playWebAudioRingtone();
    }, 2000); // More frequent rings for urgency
  }, [playWebAudioRingtone]);

  const stopRingtone = useCallback(() => {
    isPlayingRef.current = false;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  // Handle visibility change - restart ringtone when app comes back to foreground
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying && !isPlayingRef.current) {
        // App returned to foreground and should be playing - restart ringtone
        startRingtone();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying, startRingtone]);

  useEffect(() => {
    if (isPlaying) {
      startRingtone();
    } else {
      stopRingtone();
    }

    return () => {
      stopRingtone();
    };
  }, [isPlaying, startRingtone, stopRingtone]);
};
