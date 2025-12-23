import { Area } from "react-easy-crop";

export interface CropData {
  croppedAreaPixels: Area;
  aspectRatio: number;
}

export interface AspectRatioOption {
  id: string;
  label: string;
  value: number | null; // null means free aspect ratio
  icon: string;
}

export const aspectRatioOptions: AspectRatioOption[] = [
  { id: "original", label: "Original", value: null, icon: "crop_free" },
  { id: "square", label: "1:1", value: 1, icon: "crop_square" },
  { id: "portrait", label: "4:5", value: 4 / 5, icon: "crop_portrait" },
  { id: "landscape", label: "16:9", value: 16 / 9, icon: "crop_landscape" },
  { id: "story", label: "9:16", value: 9 / 16, icon: "crop_portrait" },
];

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.crossOrigin = "anonymous";
    image.src = url;
  });

export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Set canvas size to the crop area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Return as blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas is empty"));
        }
      },
      "image/jpeg",
      0.95
    );
  });
};

export const hasCropData = (cropData?: CropData): boolean => {
  if (!cropData) return false;
  const { croppedAreaPixels } = cropData;
  return (
    croppedAreaPixels.width > 0 &&
    croppedAreaPixels.height > 0
  );
};
