import { NextResponse } from "next/server";
import { StoreError } from "./store";

export function idempotencyKey(req: Request): string | null {
  const key = req.headers.get("idempotency-key");
  return key && key.trim() !== "" ? key.trim() : null;
}

const SHA256_PATTERN = /^[a-f0-9]{64}$/;

/**
 * Reads the optional output-photo evidence from a retirement request.
 * Accepts both the legacy `photo` field and the explicit url/hash pair.
 */
export function readPhotoFields(body: unknown): {
  photoUrl?: string;
  photoHash?: string;
  error?: string;
} {
  const record =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const asString = (value: unknown) =>
    typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;

  const photoUrl =
    asString(record.outputPhotoUrl) ?? asString(record.photoUrl) ?? asString(record.photo);
  const photoHash = asString(record.outputPhotoHash) ?? asString(record.photoHash);

  if (photoUrl && !/^(https?:\/\/|\/)/.test(photoUrl)) {
    return { error: "photoUrl must be an absolute URL or a site-relative path" };
  }
  if (photoHash && !SHA256_PATTERN.test(photoHash)) {
    return { error: "photoHash must be a 64-character SHA-256 hash" };
  }

  return { photoUrl, photoHash };
}

export function failure(
  err: unknown,
  fallbackMessage: string,
  fallbackStatus = 500
): NextResponse {
  if (err instanceof StoreError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(fallbackMessage, err);
  return NextResponse.json({ error: fallbackMessage }, { status: fallbackStatus });
}
