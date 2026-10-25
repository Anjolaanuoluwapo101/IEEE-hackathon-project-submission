import { NextResponse } from "next/server";
import { failure, idempotencyKey, readPhotoFields } from "@/lib/api-utils";
import { authorizeApi } from "@/lib/api-auth";
import { performRetirement } from "@/lib/retire-flow";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeApi("recycler");
    if (auth.response) return auth.response;

    const { id } = await params;
    const body = await req.json();
    const {
      productType,
      quantity,
      qualityGrade,
      notes,
      recipientAddress,
    } = body ?? {};

    if (!productType || quantity === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: productType, quantity" },
        { status: 400 }
      );
    }

    const photo = readPhotoFields(body);
    if (photo.error) {
      return NextResponse.json({ error: photo.error }, { status: 400 });
    }

    const key = idempotencyKey(req);
    const result = await performRetirement(
      id,
      auth.session,
      {
        productType,
        quantity,
        photo: photo.photoUrl,
        photoUrl: photo.photoUrl,
        photoHash: photo.photoHash,
        qualityGrade,
        notes,
        recipientAddress,
      },
      key
    );

    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    return failure(err, "Failed to process batch output");
  }
}
