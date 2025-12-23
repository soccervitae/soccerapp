import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ImageFilters,
  FilterPreset,
  filterPresets,
  getDefaultFilters,
  getCSSFilterWithFade,
  areFiltersDefault,
} from "@/hooks/useImageFilters";

interface PhotoFilterEditorProps {
  imageUrl: string;
  initialFilters?: ImageFilters;
  onApply: (filters: ImageFilters) => void;
  onCancel: () => void;
}

interface FilterSliderProps {
  icon: string;
  label: string;
  value: number;
  min: number;
  max: number;
  defaultValue: number;
  onChange: (value: number) => void;
}

const FilterSlider = ({
  icon,
  label,
  value,
  min,
  max,
  defaultValue,
  onChange,
}: FilterSliderProps) => {
  const displayValue = value - defaultValue;
  const isModified = value !== defaultValue;

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <span className="material-symbols-outlined text-[20px] text-muted-foreground">
        {icon}
      </span>
      <span className="text-sm text-foreground w-24">{label}</span>
      <div className="flex-1">
        <Slider
          value={[value]}
          min={min}
          max={max}
          step={1}
          onValueChange={([v]) => onChange(v)}
          className="w-full"
        />
      </div>
      <span
        className={`text-xs w-10 text-right font-medium ${
          isModified ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {displayValue > 0 ? `+${displayValue}` : displayValue}
      </span>
    </div>
  );
};

export const PhotoFilterEditor = ({
  imageUrl,
  initialFilters,
  onApply,
  onCancel,
}: PhotoFilterEditorProps) => {
  const [filters, setFilters] = useState<ImageFilters>(
    initialFilters || getDefaultFilters()
  );
  const [activePreset, setActivePreset] = useState<string | null>(
    initialFilters ? null : "normal"
  );
  const [showAdjustments, setShowAdjustments] = useState(false);

  const cssStyle = useMemo(() => getCSSFilterWithFade(filters), [filters]);

  const handlePresetClick = (preset: FilterPreset) => {
    setFilters({ ...preset.filters });
    setActivePreset(preset.id);
  };

  const handleSliderChange = (key: keyof ImageFilters, value: number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setActivePreset(null);
  };

  const handleReset = () => {
    setFilters(getDefaultFilters());
    setActivePreset("normal");
  };

  const hasChanges = !areFiltersDefault(filters);

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
        <span className="text-base font-bold text-foreground">Editar Foto</span>
        <Button
          onClick={() => onApply(filters)}
          size="sm"
          className="rounded font-semibold text-xs h-8 px-4"
        >
          Aplicar
        </Button>
      </div>

      {/* Image Preview */}
      <div className="flex-1 flex items-center justify-center p-4 bg-muted/30 overflow-hidden">
        <div className="relative max-w-full max-h-full">
          <img
            src={imageUrl}
            alt="Preview"
            className="max-w-full max-h-[40vh] object-contain rounded-lg"
            style={cssStyle}
          />
        </div>
      </div>

      {/* Filter Presets */}
      <div className="border-t border-border">
        <ScrollArea className="w-full">
          <div className="flex gap-3 p-4">
            {filterPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetClick(preset)}
                className={`flex flex-col items-center gap-2 flex-shrink-0 transition-all ${
                  activePreset === preset.id
                    ? "opacity-100"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    activePreset === preset.id
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={preset.name}
                    className="w-full h-full object-cover"
                    style={getCSSFilterWithFade(preset.filters)}
                  />
                </div>
                <span
                  className={`text-xs font-medium ${
                    activePreset === preset.id
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Manual Adjustments Toggle */}
      <div className="border-t border-border">
        <button
          onClick={() => setShowAdjustments(!showAdjustments)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-foreground">
              tune
            </span>
            <span className="text-sm font-medium text-foreground">
              Ajustes Manuais
            </span>
          </div>
          <span
            className={`material-symbols-outlined text-[20px] text-muted-foreground transition-transform ${
              showAdjustments ? "rotate-180" : ""
            }`}
          >
            expand_more
          </span>
        </button>

        {showAdjustments && (
          <div className="pb-4 space-y-1">
            <FilterSlider
              icon="light_mode"
              label="Brilho"
              value={filters.brightness}
              min={0}
              max={200}
              defaultValue={100}
              onChange={(v) => handleSliderChange("brightness", v)}
            />
            <FilterSlider
              icon="contrast"
              label="Contraste"
              value={filters.contrast}
              min={0}
              max={200}
              defaultValue={100}
              onChange={(v) => handleSliderChange("contrast", v)}
            />
            <FilterSlider
              icon="palette"
              label="Saturação"
              value={filters.saturation}
              min={0}
              max={200}
              defaultValue={100}
              onChange={(v) => handleSliderChange("saturation", v)}
            />
            <FilterSlider
              icon="thermostat"
              label="Temperatura"
              value={filters.temperature}
              min={-100}
              max={100}
              defaultValue={0}
              onChange={(v) => handleSliderChange("temperature", v)}
            />
            <FilterSlider
              icon="blur_on"
              label="Fade"
              value={filters.fade}
              min={0}
              max={100}
              defaultValue={0}
              onChange={(v) => handleSliderChange("fade", v)}
            />

            {hasChanges && (
              <div className="px-4 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="w-full"
                >
                  <span className="material-symbols-outlined text-[16px] mr-2">
                    restart_alt
                  </span>
                  Resetar Ajustes
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
