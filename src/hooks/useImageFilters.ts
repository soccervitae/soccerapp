export interface ImageFilters {
  brightness: number;  // 0-200 (100 = normal)
  contrast: number;    // 0-200 (100 = normal)
  saturation: number;  // 0-200 (100 = normal)
  temperature: number; // -100 to 100 (0 = normal)
  fade: number;        // 0-100 (0 = normal)
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: ImageFilters;
}

export const getDefaultFilters = (): ImageFilters => ({
  brightness: 100,
  contrast: 100,
  saturation: 100,
  temperature: 0,
  fade: 0,
});

export const filterPresets: FilterPreset[] = [
  { id: "normal", name: "Normal", filters: getDefaultFilters() },
  { id: "clarendon", name: "Clarendon", filters: { brightness: 110, contrast: 115, saturation: 120, temperature: 0, fade: 0 } },
  { id: "juno", name: "Juno", filters: { brightness: 105, contrast: 115, saturation: 130, temperature: 10, fade: 0 } },
  { id: "lark", name: "Lark", filters: { brightness: 110, contrast: 90, saturation: 100, temperature: 15, fade: 10 } },
  { id: "ludwig", name: "Ludwig", filters: { brightness: 105, contrast: 95, saturation: 85, temperature: 0, fade: 15 } },
  { id: "valencia", name: "Valencia", filters: { brightness: 108, contrast: 100, saturation: 110, temperature: 20, fade: 5 } },
  { id: "moon", name: "Moon", filters: { brightness: 110, contrast: 100, saturation: 0, temperature: 0, fade: 0 } },
  { id: "gingham", name: "Gingham", filters: { brightness: 105, contrast: 95, saturation: 90, temperature: 0, fade: 20 } },
  { id: "rise", name: "Rise", filters: { brightness: 115, contrast: 95, saturation: 105, temperature: 25, fade: 10 } },
  { id: "slumber", name: "Slumber", filters: { brightness: 100, contrast: 90, saturation: 80, temperature: -10, fade: 25 } },
];

export const getCSSFilter = (filters: ImageFilters): string => {
  const brightness = filters.brightness / 100;
  const contrast = filters.contrast / 100;
  const saturation = filters.saturation / 100;
  
  // Sepia for warm temperature, hue-rotate for cool
  let tempFilter = "";
  if (filters.temperature > 0) {
    tempFilter = ` sepia(${filters.temperature / 100 * 0.3})`;
  } else if (filters.temperature < 0) {
    tempFilter = ` hue-rotate(${filters.temperature * 0.5}deg)`;
  }
  
  return `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})${tempFilter}`;
};

export const getCSSFilterWithFade = (filters: ImageFilters): React.CSSProperties => {
  return {
    filter: getCSSFilter(filters),
    opacity: 1 - (filters.fade / 200), // fade reduces opacity slightly
  };
};

const loadImageFromBlob = (blob: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
};

const applyTemperatureOverlay = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  temperature: number
) => {
  if (temperature === 0) return;
  
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  
  if (temperature > 0) {
    // Warm - orange overlay
    ctx.fillStyle = `rgba(255, 150, 50, ${(temperature / 100) * 0.15})`;
  } else {
    // Cool - blue overlay
    ctx.fillStyle = `rgba(50, 100, 255, ${(Math.abs(temperature) / 100) * 0.15})`;
  }
  
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
};

const applyFadeOverlay = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fade: number
) => {
  if (fade === 0) return;
  
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = `rgba(245, 245, 245, ${(fade / 100) * 0.3})`;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
};

export const applyFiltersToBlob = async (
  blob: Blob,
  filters: ImageFilters
): Promise<Blob> => {
  const img = await loadImageFromBlob(blob);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  
  if (!ctx) throw new Error("Could not get canvas context");
  
  canvas.width = img.width;
  canvas.height = img.height;
  
  // Apply CSS-like filters
  ctx.filter = getCSSFilter(filters);
  ctx.drawImage(img, 0, 0);
  
  // Reset filter for overlays
  ctx.filter = "none";
  
  // Apply temperature overlay
  applyTemperatureOverlay(ctx, canvas.width, canvas.height, filters.temperature);
  
  // Apply fade overlay
  applyFadeOverlay(ctx, canvas.width, canvas.height, filters.fade);
  
  // Cleanup
  URL.revokeObjectURL(img.src);
  
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (resultBlob) => {
        if (resultBlob) {
          resolve(resultBlob);
        } else {
          reject(new Error("Failed to create blob from canvas"));
        }
      },
      "image/jpeg",
      0.95
    );
  });
};

export const areFiltersDefault = (filters: ImageFilters): boolean => {
  const defaults = getDefaultFilters();
  return (
    filters.brightness === defaults.brightness &&
    filters.contrast === defaults.contrast &&
    filters.saturation === defaults.saturation &&
    filters.temperature === defaults.temperature &&
    filters.fade === defaults.fade
  );
};
