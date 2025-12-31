import { useRef, useCallback } from "react";

export const useWhistleSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playWhistle = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const ctx = audioContextRef.current;
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Create oscillator for whistle sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Whistle frequency pattern (high-pitched referee whistle)
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(2800, now);
    oscillator.frequency.linearRampToValueAtTime(3200, now + 0.1);
    oscillator.frequency.setValueAtTime(3200, now + 0.1);
    oscillator.frequency.linearRampToValueAtTime(2600, now + 0.4);

    // Volume envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gainNode.gain.setValueAtTime(0.3, now + 0.3);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.5);

    // Add slight vibrato for realism
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.frequency.value = 6;
    vibratoGain.gain.value = 50;
    vibrato.connect(vibratoGain);
    vibratoGain.connect(oscillator.frequency);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    vibrato.start(now);
    oscillator.start(now);
    oscillator.stop(now + 0.5);
    vibrato.stop(now + 0.5);
  }, []);

  return { playWhistle };
};
