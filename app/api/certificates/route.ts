import { NextResponse } from "next/server";
import { mutateJsonFile } from "@/lib/store";
import {
  CERTIFICATES_FILE,
  readBatches,
  readCertificates,
  type Certificate,
} from "@/lib/data";
import { failure, idempotencyKey } from "@/lib/api-utils";
import { authorizeApi } from "@/lib/api-auth";

export async function POST(req: Request) {
  try {
    const auth = await authorizeApi("producer");
    if (auth.response) return auth.response;
    const producerId = auth.session.id;

    const body = await req.json();
    const { batchIds } = body;

    if (!Array.isArray(batchIds) || batchIds.length === 0) {
      return NextResponse.json(
        { error: "Missing required field: batchIds[]" },
        { status: 400 }
      );
    }

    const requested: string[] = batchIds.map((id: unknown) => String(id));
    const batches = await readBatches();
    const selected = batches.filter((b) => requested.includes(b.id));

    const missing = requested.filter(
      (id) => !selected.some((b) => b.id === id)
    );
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Unknown batches: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const notRetired = selected.filter((b) => b.status !== "retired");
    if (notRetired.length > 0) {
      return NextResponse.json(
        {
          error: "All batches must be retired before issuing a certificate",
          batches: notRetired.map((b) => ({ id: b.id, status: b.status })),
        },
        { status: 409 }
      );
    }

    const totalsByMaterial: Record<string, number> = {};
    let totalCredits = 0;

    for (const batch of selected) {
      const tonnes = batch.co2eSavedTonnes ?? 0;
      totalsByMaterial[batch.material] =
        (totalsByMaterial[batch.material] ?? 0) + tonnes;
      totalCredits += tonnes;
    }

    if (totalCredits <= 0) {
      return NextResponse.json(
        { error: "Selected batches have no minted credits" },
        { status: 409 }
      );
    }

    const key = idempotencyKey(req);
    const issuedAt = new Date().toISOString();
    const record: Certificate = {
      id: `cert-${Date.now()}`,
      producerId,
      batchIds: requested,
      totalsByMaterial,
      totalCredits,
      issueTx: null,
      status: "issued",
      idempotencyKey: key,
      issuedAt,
    };

    const list = await mutateJsonFile<Certificate[]>(
      CERTIFICATES_FILE,
      [],
      (current) => {
        if (key && current.some((c) => c.idempotencyKey === key)) {
          return current;
        }

        const claimed = new Set(current.flatMap((c) => c.batchIds));
        if (requested.some((id) => claimed.has(id))) {
          return current;
        }

        current.push(record);
        return current;
      }
    );

    const preexisting = key
      ? list.find((c) => c.idempotencyKey === key)
      : undefined;

    const saved = list.find((c) => c.id === record.id) ?? preexisting ?? null;

    if (!saved) {
      const claimed = new Set(list.flatMap((c) => c.batchIds));
      const overlaps = requested.filter((id) => claimed.has(id));
      return NextResponse.json(
        {
          error: "Some batches are already covered by another certificate",
          batches: overlaps,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: true, certificate: saved },
      { status: 201 }
    );
  } catch (err) {
    return failure(err, "Certificate issuance failed");
  }
}

export async function GET() {
  try {
    const auth = await authorizeApi("producer");
    if (auth.response) return auth.response;

    const certificates = (await readCertificates())
      .filter(
        (certificate) => certificate.producerId === auth.session.id
      )
      .sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1));

    return NextResponse.json({ success: true, certificates });
  } catch (err) {
    return failure(err, "Failed to list certificates");
  }
}
