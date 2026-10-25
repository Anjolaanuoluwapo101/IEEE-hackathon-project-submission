import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { IMAGE_LIMITS } from "./config";
import { normalizeMaterial, type CanonicalMaterial } from "./materials";
import { StoreError } from "./store";

export type StorageBackend = "blob" | "local" | "sample";

export type StoredImage = {
  url: string;
  hash: string;
  size: number;
  contentType: string;
  backend: StorageBackend;
};

export const SAMPLE_FILES: Record<CanonicalMaterial, string> = {
  pet: "pet.svg",
  hdpe: "hdpe.svg",
  plastic: "plastic.svg",
  paper: "paper.svg",
  glass: "glass.svg",
  metal: "metal.svg",
  aluminum: "metal.svg",
  organic: "organic.svg",
  e_waste: "e_waste.svg",
  tires: "plastic.svg",
  general_mixed_recyclables: "mixed.svg",
};

/** Detects the real image type from magic bytes, ignoring the client's header. */
export function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function storageBackend(): StorageBackend {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  if (!process.env.VERCEL) return "local";
  return "sample";
}

function extensionFor(contentType: string): string {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";
  return "webp";
}

/**
 * Uploads one image and returns its public URL plus the SHA-256 of the bytes.
 * The hash is always computed server-side so it cannot be spoofed by the client.
 */
export async function putImage(input: {
  bytes: Uint8Array;
  prefix?: string;
}): Promise<StoredImage> {
  const { bytes, prefix = "images" } = input;

  if (bytes.length === 0) {
    throw new StoreError("Empty image upload", 400);
  }
  if (bytes.length > IMAGE_LIMITS.hardMaxBytes) {
    throw new StoreError(
      `Image too large after compression (${bytes.length} bytes). Limit is ${IMAGE_LIMITS.hardMaxBytes} bytes.`,
      413
    );
  }

  const contentType = sniffImageType(bytes);
  if (!contentType) {
    throw new StoreError("Unsupported image type: use JPEG, PNG or WebP", 415);
  }

  const hash = sha256Hex(bytes);
  const backend = storageBackend();
  const ext = extensionFor(contentType);
  const fileName = `${hash.slice(0, 16)}-${randomUUID()}.${ext}`;

  if (backend === "local") {
    const dir = path.join(process.cwd(), ".uploads", prefix);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, fileName), bytes);
    return {
      url: `/api/media/${prefix}/${fileName}`,
      hash,
      size: bytes.length,
      contentType,
      backend,
    };
  }

  if (backend === "blob") {
    const { put } = await import("@vercel/blob");
    const blob = await put(`${prefix}/${fileName}`, new Blob([bytes as unknown as BlobPart], { type: contentType }), {
      access: "public",
      contentType,
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return {
      url: blob.url,
      hash,
      size: bytes.length,
      contentType,
      backend,
    };
  }

  throw new StoreError(
    "No image storage configured. Add BLOB_READ_WRITE_TOKEN to .env.local, or run outside Vercel to use local disk storage.",
    503
  );
}

/** Deterministic fallback image shipped in /public/samples (PRD 14.2). */
export async function sampleImage(material: unknown): Promise<StoredImage> {
  const canonical = normalizeMaterial(material) ?? "general_mixed_recyclables";
  const fileName = SAMPLE_FILES[canonical];
  const bytes = await readFile(
    path.join(process.cwd(), "public", "samples", fileName)
  );
  return {
    url: `/samples/${fileName}`,
    hash: sha256Hex(bytes),
    size: bytes.length,
    contentType: "image/svg+xml",
    backend: "sample",
  };
}
