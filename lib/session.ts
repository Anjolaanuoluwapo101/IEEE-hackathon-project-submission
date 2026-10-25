import type { Role } from "./data";

export const SESSION_COOKIE = "cl_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  name: string;
  role: Role;
  org: string;
  area: string;
  walletAddress: string;
};

export const ROLE_HOME: Record<Role, string> = {
  picker: "/scan",
  aggregator: "/agg",
  recycler: "/rec",
  producer: "/prod",
};

export const ROLE_LABELS: Record<Role, string> = {
  picker: "Picker",
  aggregator: "Aggregator",
  recycler: "Recycler",
  producer: "Producer",
};

const VALID_ROLES: Role[] = ["picker", "aggregator", "recycler", "producer"];

type SessionPayload = {
  uid: string;
  role: Role;
  iat: number;
};

let cachedKey: Promise<CryptoKey> | null = null;

function sessionSecret(): string {
  return process.env.AUTH_SECRET || "circulagos-demo-secret-change-me";
}

function getKey(): Promise<CryptoKey> {
  if (!cachedKey) {
    cachedKey = crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(sessionSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
  }
  return cachedKey;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function isRole(value: unknown): value is Role {
  return typeof value === "string" && VALID_ROLES.includes(value as Role);
}

export async function createSessionToken(
  userId: string,
  role: Role
): Promise<string> {
  const payload: SessionPayload = { uid: userId, role, iat: Date.now() };
  const encodedPayload = bytesToBase64Url(
    new TextEncoder().encode(JSON.stringify(payload))
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getKey(),
    new TextEncoder().encode(encodedPayload)
  );
  return `${encodedPayload}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) return null;

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await getKey(),
      base64UrlToBytes(encodedSignature),
      new TextEncoder().encode(encodedPayload)
    );
    if (!valid) return null;

    const parsed = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(encodedPayload))
    ) as Partial<SessionPayload>;

    if (typeof parsed.uid !== "string" || !isRole(parsed.role)) return null;
    if (typeof parsed.iat !== "number") return null;

    const age = Date.now() - parsed.iat;
    if (age < 0 || age > SESSION_MAX_AGE_SECONDS * 1000) return null;

    return { uid: parsed.uid, role: parsed.role, iat: parsed.iat };
  } catch {
    return null;
  }
}
