import { useEffect, useRef } from "react";

export const useDialTone = (isPlaying: boolean) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      audioContextRef.current = new AudioContext();
      const ctx = audioContextRef.current;

      const playDialTone = () => {
        if (!audioContextRef.current || audioContextRef.current.state === "closed") return;

        const gain = ctx.createGain();
        gain.connect(ctx.destination);

        // Single tone - 425Hz (European standard dial tone)
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 425;
        osc.connect(gain);

        // Lower volume than ringtone - less intrusive for caller
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.8);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1);
      };

      // Play immediately and then loop
      playDialTone();
      intervalRef.current = window.setInterval(() => {
        playDialTone();
      }, 4000); // 1s sound + 3s silence

    } else {
      // Cleanup
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [isPlaying]);
};
