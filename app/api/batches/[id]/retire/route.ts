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
    const { outputProduct, outputQuantity, qualityGrade, notes } = body ?? {};

    if (!outputProduct || outputQuantity === undefined) {
      return NextResponse.json(
        {
          error: "Missing required fields: outputProduct, outputQuantity",
        },
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
        productType: outputProduct,
        quantity: outputQuantity,
        photo: photo.photoUrl,
        photoUrl: photo.photoUrl,
        photoHash: photo.photoHash,
        qualityGrade,
        notes,
      },
      key
    );

    if (result.status !== 200) {
      return NextResponse.json(result.body, { status: result.status });
    }

    const b = result.body as {
      co2eSavedKg: number;
      co2eSavedTonnes: number;
      creditsMinted: number;
      creditTokenId: number | null;
      material: string;
      weightKg: number;
      photoUrl: string | null;
      photoHash: string | null;
      retireTx: string | null;
      payout:
        | {
            currency: string;
            pickerAmount: number;
            aggregatorAmount: number;
            txHash?: string | null;
          }
        | undefined;
      idempotent: boolean;
    };

    return NextResponse.json(
      {
        ...result.body,
        recyclerId: auth.session.id,
        co2eAvoidedKg: b.co2eSavedKg,
        co2eAvoidedTonnes: b.co2eSavedTonnes,
        credits: b.creditsMinted,
        product: outputProduct,
        quantity: outputQuantity,
        photoUrl: b.photoUrl ?? photo.photoUrl ?? null,
        photoHash: b.photoHash ?? photo.photoHash ?? null,
        retireTx: b.retireTx ?? null,
        creditNFT: {
          tokenId: b.creditTokenId,
          material: b.material,
          weightKg: b.weightKg,
          co2eAvoidedTonnes: b.co2eSavedTonnes,
          txHash: b.payout?.txHash,
        },
      },
      { status: b.idempotent ? 200 : 201 }
    );
  } catch (err) {
    return failure(err, "Retire failed");
  }
}
