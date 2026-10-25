import { NextResponse } from "next/server";
import { readBatches, readCertificates } from "@/lib/data";
import { failure } from "@/lib/api-utils";
import { authorizeApi } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await authorizeApi("producer");
    if (auth.response) return auth.response;

    const batches = await readBatches();
    const certificates = await readCertificates();
    const claimed = new Set(
      certificates.flatMap((certificate) => certificate.batchIds)
    );

    const pool = batches
      .filter((batch) => batch.status === "retired")
      .map((batch) => ({
        id: batch.id,
        material: batch.material,
        weightKg: batch.receivedWeightKg ?? batch.loggedWeightKg,
        retiredAt: batch.retiredAt ?? null,
        co2eSavedTonnes: batch.co2eSavedTonnes ?? 0,
        creditsMinted: batch.creditsMinted ?? 0,
        retireTx: batch.retireTx ?? null,
        claimed: claimed.has(batch.id),
      }))
      .sort((a, b) => ((a.retiredAt ?? "") < (b.retiredAt ?? "") ? 1 : -1));

    const totalsByMaterial: Record<string, number> = {};
    for (const batch of pool) {
      if (batch.claimed) continue;
      totalsByMaterial[batch.material] =
        (totalsByMaterial[batch.material] ?? 0) + batch.weightKg;
    }

    return NextResponse.json({
      success: true,
      batches: pool,
      totalsByMaterial,
    });
  } catch (err) {
    return failure(err, "Failed to load verified pool");
  }
}
