import { useState, useEffect } from "react";
import stadiumImg from "@/assets/soccer-player-hero.jpg";
import varzeaImg from "@/assets/varzea-match.jpg";
import kidsImg from "@/assets/kids-training.jpg";

const slides = [
  { src: stadiumImg, label: "Estádio" },
  { src: varzeaImg, label: "Várzea" },
  { src: kidsImg, label: "Base" },
];

interface SoccerShowcaseProps {
  fullscreen?: boolean;
}

const SoccerShowcase = ({ fullscreen = false }: SoccerShowcaseProps) => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (fullscreen) {
    return (
      <>
        {slides.map((slide, i) => (
          <img
            key={i}
            src={slide.src}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              i === active ? "opacity-40" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
      </>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="relative w-full aspect-video rounded-lg overflow-hidden">
        {slides.map((slide, i) => (
          <img
            key={i}
            src={slide.src}
            alt={slide.label}
            loading="lazy"
            width={1024}
            height={640}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <p className="absolute bottom-3 left-3 text-white text-sm font-semibold tracking-wide">
          {slides[active].label}
        </p>
      </div>
      <div className="flex justify-center gap-2 mt-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === active ? "bg-primary w-5" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default SoccerShowcase;
