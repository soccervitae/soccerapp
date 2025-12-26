import { RotateCcw } from "lucide-react";

const OrientationLock = () => {
  return (
    <div className="orientation-lock-overlay fixed inset-0 z-[9999] bg-primary flex-col items-center justify-center hidden">
      <div className="flex flex-col items-center justify-center text-center px-8">
        <RotateCcw className="w-16 h-16 text-primary-foreground animate-pulse mb-6" />
        <h2 className="text-primary-foreground text-2xl font-bold mb-2">
          Gire seu dispositivo
        </h2>
        <p className="text-primary-foreground/80 text-lg">
          Por favor, use o app no modo retrato
        </p>
      </div>
    </div>
  );
};

export default OrientationLock;
