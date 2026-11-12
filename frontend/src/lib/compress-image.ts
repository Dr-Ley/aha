const MAX_EDGE = 1600;
const MAX_BYTES = 1_200_000;

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not compress the image");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let quality = 0.82;
  let blob = await canvasBlob(canvas, "image/webp", quality);
  let type = blob?.type === "image/webp" ? "image/webp" : "image/jpeg";
  if (type === "image/jpeg") blob = await canvasBlob(canvas, "image/jpeg", quality);
  if (!blob) throw new Error("Could not compress the image");
  while (blob.size > MAX_BYTES && quality > 0.5) {
    quality = Math.round((quality - 0.1) * 10) / 10;
    const smaller = await canvasBlob(canvas, type, quality);
    if (!smaller) break;
    blob = smaller;
  }
  return new File([blob], type === "image/webp" ? "image.webp" : "image.jpg", { type });
}
