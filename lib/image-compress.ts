"use client";

import { IMAGE_LIMITS } from "./config";

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not encode the image"));
      },
      "image/jpeg",
      quality
    );
  });
}

/**
 * Resizes to a 1280px long edge and compresses to roughly 300KB JPEG.
 * Runs in the browser before upload so mobile data usage stays low (PRD FR-I2).
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} is not an image`);
  }
  if (file.size > IMAGE_LIMITS.maxOriginalBytes) {
    throw new Error(
      `${file.name} is ${formatMb(file.size)}. Choose an image under ${formatMb(
        IMAGE_LIMITS.maxOriginalBytes
      )}.`
    );
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();

    const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
    const scale =
      longestEdge > IMAGE_LIMITS.maxEdge
        ? IMAGE_LIMITS.maxEdge / longestEdge
        : 1;

    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser cannot process images");

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, width, height);

    let quality = 0.72;
    let blob = await canvasToBlob(canvas, quality);

    while (blob.size > IMAGE_LIMITS.targetBytes && quality > 0.4) {
      quality -= 0.08;
      blob = await canvasToBlob(canvas, quality);
    }

    if (blob.size > IMAGE_LIMITS.hardMaxBytes) {
      throw new Error(
        `${file.name} is still ${formatMb(blob.size)} after compression`
      );
    }

    const name = `${file.name.replace(/\.[^.]+$/, "") || "photo"}.jpg`;
    return new File([blob], name, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function compressImages(
  files: File[],
  onProgress?: (done: number, total: number) => void
): Promise<File[]> {
  const output: File[] = [];
  for (let index = 0; index < files.length; index += 1) {
    output.push(await compressImage(files[index]));
    onProgress?.(index + 1, files.length);
  }
  return output;
}
