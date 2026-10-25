import { NextResponse } from "next/server";
import { findDemoAccount } from "@/lib/demo-users";
import { readBatches, readCertificates } from "@/lib/data";
import { failure } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const certificates = await readCertificates();
    const certificate = certificates.find((item) => item.id === id);

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    const allBatches = await readBatches();
    const batches = certificate.batchIds.flatMap((batchId) => {
      const batch = allBatches.find((item) => item.id === batchId);
      if (!batch) return [];
      return [
        {
          id: batch.id,
          material: batch.material,
          loggedWeightKg: batch.loggedWeightKg,
          receivedWeightKg: batch.receivedWeightKg ?? null,
          weightKg: batch.receivedWeightKg ?? batch.loggedWeightKg,
          status: batch.status,
          retireTx: batch.retireTx ?? null,
          retiredAt: batch.retiredAt ?? null,
          co2eSavedKg: batch.co2eSavedKg ?? null,
          co2eSavedTonnes: batch.co2eSavedTonnes ?? null,
          creditsMinted: batch.creditsMinted ?? null,
          creditTokenId: batch.creditTokenId ?? null,
        },
      ];
    });

    const producer = findDemoAccount(certificate.producerId);

    return NextResponse.json({
      success: true,
      certificate,
      producer: producer
        ? { id: producer.id, name: producer.name, org: producer.org }
        : { id: certificate.producerId, name: certificate.producerId, org: certificate.producerId },
      batches,
    });
  } catch (err) {
    return failure(err, "Failed to fetch certificate");
  }
}
