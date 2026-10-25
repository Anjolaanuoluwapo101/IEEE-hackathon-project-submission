import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  if (
    !segments ||
    segments.length === 0 ||
    segments.some((segment) => !SAFE_SEGMENT.test(segment))
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), ".uploads", ...segments);

  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("Not a file");

    const bytes = await readFile(filePath);
    const contentType =
      CONTENT_TYPES[path.extname(filePath).toLowerCase()] ??
      "application/octet-stream";

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(bytes.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
