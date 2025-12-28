import { useEffect, useRef } from "react";

export const useRingtone = (isPlaying: boolean) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const playRingTone = () => {
      if (!audioContextRef.current || audioContextRef.current.state === "closed") return;
      
      const ctx = audioContextRef.current;
      const gain = ctx.createGain();
      gain.connect(ctx.destination);

      // First beep - 440Hz
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.value = 440;
      osc1.connect(gain);

      // Fade in/out - higher volume for urgency
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
    };

    const startRingtone = () => {
      // Create AudioContext
      audioContextRef.current = new AudioContext();
      
      // Resume if suspended (autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      // Play immediately and loop more frequently
      playRingTone();
      intervalRef.current = window.setInterval(() => {
        playRingTone();
      }, 2000);
    };

    const stopRingtone = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };

    // Handle visibility change - restart ringtone when returning to foreground
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying && !intervalRef.current) {
        startRingtone();
      }
    };

    if (isPlaying) {
      startRingtone();
      document.addEventListener('visibilitychange', handleVisibilityChange);
    } else {
      stopRingtone();
    }

    return () => {
      stopRingtone();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);
};
