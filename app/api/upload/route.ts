import { NextResponse } from "next/server";
import { failure } from "@/lib/api-utils";
import { authorizeApi } from "@/lib/api-auth";
import { IMAGE_LIMITS } from "@/lib/config";
import { putImage, storageBackend, type StoredImage } from "@/lib/storage";
import { StoreError } from "@/lib/store";

const ALLOWED_PREFIXES = new Set(["intake", "output", "evidence", "images"]);

function isUpload(value: unknown): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    typeof (value as File).arrayBuffer === "function"
  );
}

export async function GET() {
  return NextResponse.json({
    success: true,
    backend: storageBackend(),
    limits: IMAGE_LIMITS,
  });
}

export async function POST(req: Request) {
  try {
    const auth = await authorizeApi();
    if (auth.response) return auth.response;

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      throw new StoreError(
        "Send multipart/form-data with one or more 'files' fields",
        415
      );
    }

    const form = await req.formData();
    const rawPrefix = form.get("prefix");
    const prefix =
      typeof rawPrefix === "string" && ALLOWED_PREFIXES.has(rawPrefix)
        ? rawPrefix
        : "images";

    const candidates = [...form.getAll("files"), ...form.getAll("images")];
    const files = candidates.filter(isUpload);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No images received. Add one or more 'files' fields." },
        { status: 400 }
      );
    }
    if (files.length > IMAGE_LIMITS.maxFiles) {
      return NextResponse.json(
        { error: `At most ${IMAGE_LIMITS.maxFiles} images per upload` },
        { status: 400 }
      );
    }

    const images: StoredImage[] = [];
    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      images.push(await putImage({ bytes, prefix }));
    }

    return NextResponse.json(
      { success: true, backend: storageBackend(), images },
      { status: 201 }
    );
  } catch (err) {
    return failure(err, "Image upload failed");
  }
}
