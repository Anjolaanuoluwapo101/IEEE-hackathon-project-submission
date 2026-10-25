import { readBatches, readPayouts, readCertificates, readIntakes } from "./data";
import { getEmissionFactor } from "./data";

export async function getImpactStats() {
  const [batches, payouts, certificates, intakes] = await Promise.all([
    readBatches(),
    readPayouts(),
    readCertificates(),
    readIntakes(),
  ]);

  const retiredBatches = batches.filter((b) => b.status === "retired");
  const verifiedKg = retiredBatches.reduce(
    (sum, b) => sum + (b.receivedWeightKg ?? b.loggedWeightKg),
    0
  );
  const batchCount = retiredBatches.length;
  const pickerPaidSet = new Set(
    payouts.filter((p) => p.role === "picker" && p.status === "completed").map((p) => p.recipientId)
  );
  const pickersPaid = pickerPaidSet.size;

  const byMaterial: Record<string, number> = {};
  const byArea: Record<string, number> = {};

  for (const batch of retiredBatches) {
    const kg = batch.receivedWeightKg ?? batch.loggedWeightKg;
    byMaterial[batch.material] = (byMaterial[batch.material] ?? 0) + kg;
    if (batch.location) {
      byArea[batch.location] = (byArea[batch.location] ?? 0) + kg;
    }
  }

  const weeklyKg: Record<string, number> = {};
  for (const batch of retiredBatches) {
    if (!batch.retiredAt) continue;
    const date = new Date(batch.retiredAt);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().split("T")[0];
    weeklyKg[key] = (weeklyKg[key] ?? 0) + (batch.receivedWeightKg ?? batch.loggedWeightKg);
  }

  const weakSpots = Object.entries(byArea)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([area, kg]) => ({ area, kg }));

  const recentTransactions = batches
    .filter((b) => b.retireTx || b.confirmTx || b.transferTx || b.registerTx)
    .sort((a, b) => {
      const at = a.retiredAt ?? a.updatedAt ?? a.createdAt;
      const bt = b.retiredAt ?? b.updatedAt ?? b.createdAt;
      return new Date(bt).getTime() - new Date(at).getTime();
    })
    .slice(0, 10)
    .map((b) => {
      let type = "";
      let tx = "";
      if (b.retireTx) {
        type = "Retire batch";
        tx = b.retireTx;
      } else if (b.confirmTx) {
        type = "Confirm receipt";
        tx = b.confirmTx;
      } else if (b.transferTx) {
        type = "Transfer to recycler";
        tx = b.transferTx;
      } else if (b.registerTx) {
        type = "Register batch";
        tx = b.registerTx;
      }
      return {
        time: b.retiredAt ?? b.updatedAt ?? b.createdAt,
        type,
        batchId: b.id,
        txHash: tx,
        status: b.retireTx
          ? "Confirmed"
          : b.confirmTx
          ? "Confirmed"
          : b.transferTx
          ? "Confirmed"
          : "Pending",
      };
    });

  return {
    verifiedKg: Math.round(verifiedKg * 10) / 10,
    batchCount,
    pickersPaid,
    byMaterial,
    byArea,
    weeklyKg: Object.entries(weeklyKg)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, kg]) => ({ week, kg: Math.round(kg * 10) / 10 })),
    weakSpots,
    recentTransactions,
  };
}

export async function getPublicTrail(batchId: string) {
  const batches = await readBatches();
  const batch = batches.find((b) => b.id === batchId);
  if (!batch) return null;

  const certificates = await readCertificates();
  const cert = certificates.find((c) => c.batchIds.includes(batchId));

  const trail = [
    {
      label: "Registered",
      date: batch.createdAt,
      actor: batch.aggregatorId,
      txHash: batch.registerTx,
    },
  ];

  if (batch.transferTx) {
    trail.push({
      label: "Transferred",
      date: batch.updatedAt ?? batch.createdAt,
      actor: batch.recyclerId ?? "—",
      txHash: batch.transferTx,
    });
  }

  if (batch.confirmTx) {
    trail.push({
      label: batch.mismatch?.flagged ? "Flagged" : "Received",
      date: batch.updatedAt ?? batch.createdAt,
      actor: batch.recyclerId ?? "—",
      txHash: batch.confirmTx,
    });
  }

  if (batch.retireTx) {
    trail.push({
      label: "Recycled",
      date: batch.retiredAt ?? batch.updatedAt ?? batch.createdAt,
      actor: batch.recyclerId ?? "—",
      txHash: batch.retireTx,
    });
  }

  if (cert) {
    trail.push({
      label: "Certified",
      date: cert.issuedAt ?? new Date().toISOString(),
      actor: cert.producerId ?? "—",
      txHash: cert.issueTx,
    });
  }

  return {
    batch,
    certificate: cert ?? null,
    trail,
    isClaimed: !!cert,
  };
}

export async function getPickerHistory(pickerId: string) {
  const [intakes, batches] = await Promise.all([readIntakes(), readBatches()]);

  const pickerIntakes = intakes.filter((i) => i.pickerId === pickerId);
  const pickerBatches = batches.filter((b) => b.pickerId === pickerId);

  const history = pickerIntakes.map((intake) => {
    const linkedBatch = intake.id
      ? pickerBatches.find((b) => b.intakeId === intake.id)
      : null;

    return {
      intake,
      batch: linkedBatch ?? null,
      status: linkedBatch
        ? linkedBatch.status
        : "pending",
      material: intake.aiResult?.material ?? "unknown",
      date: intake.createdAt,
      location: intake.location,
      thumbnail: intake.imageUrls?.[0] ?? null,
    };
  });

  history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return history;
}