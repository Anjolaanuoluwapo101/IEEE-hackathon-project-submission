import { NextResponse } from "next/server";
import { readChainStatus, requireSigner, chainTxHash } from "@/lib/chain";
import { BATCH_NFT } from "@/lib/chain";
import { failure } from "@/lib/api-utils";
import { authorizeApi } from "@/lib/api-auth";
import { demoTx } from "@/lib/demo";
import { mutateJsonFile } from "@/lib/store";
import {
  BATCHES_FILE,
  getWeightTolerancePct,
  readBatches,
  type Batch,
} from "@/lib/data";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeApi("recycler");
    if (auth.response) return auth.response;
    const session = auth.session;

    const { id } = await params;
    const tokenId = Number(id);
    const body = await req.json();
    const { receivedWeightKg, key } = body;

    const receivedWeight = Number(receivedWeightKg);

    if (!Number.isFinite(receivedWeight) || receivedWeight <= 0) {
      return NextResponse.json(
        { error: "receivedWeightKg must be a positive number" },
        { status: 400 }
      );
    }

    const batches = await readBatches();
    const batch = batches.find((item) => item.id === id);

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    if (batch.recyclerId !== session.id) {
      return NextResponse.json(
        { error: "Only the assigned recycler can confirm this batch" },
        { status: 403 }
      );
    }

    if (batch.status === "flagged") {
      return NextResponse.json(
        {
          error: "Batch is already flagged for a weight mismatch",
          mismatch: batch.mismatch ?? null,
        },
        { status: 409 }
      );
    }

    if (batch.status !== "in_transit") {
      return NextResponse.json(
        {
          error: `Batch cannot be confirmed from status "${batch.status}"`,
        },
        { status: 409 }
      );
    }

    const tolerancePct = await getWeightTolerancePct();

    const chainStatusBefore = batch.demo
      ? "in_transit"
      : await readChainStatus(tokenId);
    if (chainStatusBefore !== "in_transit") {
      return NextResponse.json(
        {
          error: `Batch cannot be confirmed from chain status "${
            chainStatusBefore ?? "unknown"
          }"`,
        },
        { status: 409 }
      );
    }

    let txHash: string;
    let newStatus: "received" | "flagged";

    if (batch.demo) {
      txHash = demoTx("confirm", id);
      const deltaPct = computeDeltaPct(receivedWeight, batch.loggedWeightKg);
      newStatus = deltaPct > tolerancePct ? "flagged" : "received";
    } else {
      requireSigner();
      txHash = await chainTxHash(
        BATCH_NFT.confirmReceipt(tokenId, Math.round(receivedWeight), key ?? "")
      );
      const chainStatusAfter = await readChainStatus(tokenId);
      newStatus = (chainStatusAfter ?? "received") as "received" | "flagged";
      if (newStatus !== "received" && newStatus !== "flagged") {
        newStatus = "received";
      }
    }

    const deltaPct = computeDeltaPct(receivedWeight, batch.loggedWeightKg);

    const list = await mutateJsonFile<Batch[]>(BATCHES_FILE, [], async (current) => {
      const target = current.find((item) => item.id === id);
      if (!target) return current;

      target.receivedWeightKg = receivedWeight;
      target.status = newStatus;
      target.confirmTx = txHash;
      target.confirmKey = key ?? null;
      target.mismatch = {
        deltaPct: Math.round(deltaPct * 100) / 100,
        tolerancePct,
        flagged: newStatus === "flagged",
      };
      target.updatedAt = new Date().toISOString();
      return current;
    });

    const saved = list.find((item) => item.id === id);
    if (!saved) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      idempotent: false,
      batchId: saved.id,
      recyclerId: saved.recyclerId,
      receivedWeightKg: saved.receivedWeightKg,
      loggedWeightKg: saved.loggedWeightKg,
      status: saved.status,
      mismatch: saved.mismatch ?? null,
      confirmTx: saved.confirmTx,
      batch: saved,
    });
  } catch (err) {
    return failure(err, "Confirm failed");
  }
}

function computeDeltaPct(receivedWeight: number, loggedWeight: number): number {
  if (!Number.isFinite(loggedWeight) || loggedWeight <= 0) return 0;
  return (Math.abs(receivedWeight - loggedWeight) / loggedWeight) * 100;
}
