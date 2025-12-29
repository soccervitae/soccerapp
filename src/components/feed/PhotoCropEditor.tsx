import { useState, useCallback } from "react";
import Cropper, { Area, Point } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  CropData,
  AspectRatioOption,
  aspectRatioOptions,
} from "@/hooks/useImageCrop";

interface PhotoCropEditorProps {
  imageUrl: string;
  initialCropData?: CropData;
  defaultAspectRatioId?: string;
  cropShape?: 'rect' | 'round';
  hideAspectRatioOptions?: boolean;
  onApply: (cropData: CropData) => void;
  onCancel: () => void;
}

export const PhotoCropEditor = ({
  imageUrl,
  initialCropData,
  defaultAspectRatioId,
  cropShape = 'rect',
  hideAspectRatioOptions = false,
  onApply,
  onCancel,
}: PhotoCropEditorProps) => {
  const defaultAspect = aspectRatioOptions.find(opt => opt.id === defaultAspectRatioId) || aspectRatioOptions[1];
  
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(
    initialCropData?.croppedAreaPixels || null
  );
  const [selectedAspect, setSelectedAspect] = useState<AspectRatioOption>(
    aspectRatioOptions.find(
      (opt) => opt.value === initialCropData?.aspectRatio
    ) || defaultAspect
  );

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleApply = () => {
    if (croppedAreaPixels) {
      onApply({
        croppedAreaPixels,
        aspectRatio: selectedAspect.value || 0,
      });
    }
  };

  const handleAspectChange = (option: AspectRatioOption) => {
    setSelectedAspect(option);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setSelectedAspect(defaultAspect);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button
          onClick={onCancel}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
        <span className="text-base font-bold text-foreground">Recortar</span>
        <button
          onClick={handleApply}
          className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Aplicar
        </button>
      </div>

      {/* Crop Area */}
      <div className="flex-1 relative bg-black/90">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={selectedAspect.value || undefined}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          cropShape={cropShape}
          showGrid={cropShape === 'rect'}
          style={{
            containerStyle: {
              backgroundColor: "rgba(0,0,0,0.9)",
            },
          }}
        />
      </div>

      {/* Zoom Slider */}
      <div className="px-6 py-3 border-t border-border bg-background">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[18px] text-muted-foreground">
            zoom_out
          </span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-1 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
          />
          <span className="material-symbols-outlined text-[18px] text-muted-foreground">
            zoom_in
          </span>
        </div>
      </div>

      {/* Aspect Ratio Options */}
      <div className="border-t border-border">
        <div className="flex items-center justify-between px-4 py-3">
          {!hideAspectRatioOptions && (
            <div className="flex gap-2 overflow-x-auto">
              {aspectRatioOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleAspectChange(option)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] ${
                    selectedAspect.id === option.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {option.icon}
                  </span>
                  <span className="text-[10px] font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          )}
          <div className={`flex gap-2 ${hideAspectRatioOptions ? 'w-full justify-center' : 'ml-2'}`}>
            <button
              onClick={handleRotate}
              className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              title="Girar 90°"
            >
              <span className="material-symbols-outlined text-[20px]">
                rotate_right
              </span>
            </button>
            <button
              onClick={handleReset}
              className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              title="Resetar"
            >
              <span className="material-symbols-outlined text-[20px]">
                restart_alt
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
