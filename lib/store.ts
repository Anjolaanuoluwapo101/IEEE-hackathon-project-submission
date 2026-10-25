import { cache } from "react";

function getEnv() {
  return {
    GIST_TOKEN: process.env.GIST_TOKEN || process.env.NEXT_PUBLIC_GIST_TOKEN,
    GIST_ID: process.env.GIST_ID || process.env.NEXT_PUBLIC_GIST_ID,
    GIST_API: "https://api.github.com/gists",
  };
}

export class StoreError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "StoreError";
    this.status = status;
  }
}

type GistFile = {
  content?: string;
  truncated?: boolean;
  raw_url?: string;
};

type GistResponse = {
  files?: Record<string, GistFile>;
}

function assertConfigured() {
  const { GIST_TOKEN, GIST_ID } = getEnv();
  if (
    !GIST_TOKEN ||
    !GIST_ID ||
    GIST_TOKEN.startsWith("your_") ||
    GIST_ID.startsWith("your_")
  ) {
    throw new StoreError(
      "Store is not configured: set a real GIST_TOKEN (gist scope) and GIST_ID in .env.local",
      503
    );
  }
}

async function fetchGist(): Promise<GistResponse> {
  assertConfigured();
  const { GIST_TOKEN, GIST_ID, GIST_API } = getEnv();

  const res = await fetch(`${GIST_API}/${GIST_ID}`, {
    headers: {
      Authorization: `token ${GIST_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new StoreError(
      res.status === 404
        ? "Gist not found: check GIST_ID"
        : `Gist read failed (${res.status})`,
      500
    );
  }

  return (await res.json()) as GistResponse;
}

/**
 * Request-scoped cached read used by GET routes.
 * Returns null instead of throwing so read routes can respond with their own errors.
 */
export const getGist = cache(async (): Promise<GistResponse | null> => {
  try {
    return await fetchGist();
  } catch (err) {
    console.error("Gist read error:", err instanceof Error ? err.message : err);
    return null;
  }
});

async function readFileRaw(name: string): Promise<string | null> {
  const gist = await fetchGist();
  const file = gist.files?.[name];
  if (!file) return null;

  if (file.content !== undefined && !file.truncated) {
    return file.content;
  }

  if (file.raw_url) {
    const res = await fetch(file.raw_url, { cache: "no-store" });
    if (!res.ok) {
      throw new StoreError(`Gist file download failed (${res.status})`, 500);
    }
    return await res.text();
  }

  return null;
}

export async function readJsonFile<T>(name: string, fallback: T): Promise<T> {
  const raw = await readFileRaw(name);
  if (raw === null || raw.trim() === "") return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new StoreError(`Gist file "${name}" contains invalid JSON`);
  }
}

async function patchFile(name: string, value: unknown): Promise<void> {
  const { GIST_TOKEN, GIST_ID, GIST_API } = getEnv();

  if (!GIST_TOKEN || !GIST_ID) {
    throw new StoreError(
      "Store is not configured: set a real GIST_TOKEN (gist scope) and GIST_ID in .env.local",
      503
    );
  }

  const res = await fetch(`${GIST_API}/${GIST_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `token ${GIST_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: {
        [name]: { content: JSON.stringify(value, null, 2) },
      },
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new StoreError(
        "Gist token cannot write. Recreate GIST_TOKEN with the 'gist' scope.",
        503
      );
    }
    throw new StoreError(`Gist write failed (${res.status})`, 500);
  }
}

/**
 * Serializes all writes in this process. GitHub Gists are last-write-wins,
 * so read-modify-write cycles must not overlap.
 */
let writeQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(task, task);
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export function writeJsonFile(name: string, value: unknown): Promise<void> {
  return enqueue(() => patchFile(name, value));
}

/**
 * Atomic read-modify-write for a single gist file.
 * If the mutator throws, nothing is written.
 */
export function mutateJsonFile<T>(
  name: string,
  fallback: T,
  mutator: (value: T) => T | Promise<T>
): Promise<T> {
  return enqueue(async () => {
    const current = await readJsonFile<T>(name, fallback);
    const next = await mutator(current);
    await patchFile(name, next);
    return next;
  });
}

export const getConfig = cache(async () => {
  try {
    return await readJsonFile<Record<string, unknown> | null>("config.json", null);
  } catch (err) {
    console.error("Failed to parse config:", err);
    return null;
  }
});

export const getEmissionsFactors = cache(async () => {
  try {
    return await readJsonFile<Record<string, unknown> | null>(
      "emissions_factors.json",
      null
    );
  } catch (err) {
    console.error("Failed to parse emissions factors:", err);
    return null;
  }
});