import { BATCH_NFT, chainTxHash, readChainStatus, requireSigner } from "./chain";
import { readBatches, type BatchOutput } from "./data";
import { demoTx } from "./demo";
import { retireBatch, type RetireResponse } from "./retire";
import type { SessionUser } from "./session";

export async function performRetirement(
  id: string,
  actor: SessionUser,
  output: BatchOutput,
  key: string | null
): Promise<RetireResponse> {
  const batches = await readBatches();
  const batch = batches.find((item) => item.id === id);

  if (!batch) {
    return { status: 404, body: { error: "Batch not found" } };
  }

  if (actor.role !== "recycler" || batch.recyclerId !== actor.id) {
    return {
      status: 403,
      body: { error: "Only the assigned recycler can retire this batch" },
    };
  }

  if (batch.status === "retired" && batch.retirement) {
    return retireBatch(id, output, key, batch.retireTx ?? null);
  }

  if (batch.status === "flagged") {
    return {
      status: 409,
      body: {
        error: "Batch is flagged for a weight mismatch and cannot be retired",
        mismatch: batch.mismatch ?? null,
      },
    };
  }

  if (batch.status !== "received") {
    return {
      status: 409,
      body: {
        error: `Batch must be confirmed as received before output (current status: ${batch.status})`,
      },
    };
  }

  let txHash: string;

  if (batch.demo) {
    txHash = demoTx("retire", id);
  } else {
    requireSigner();
    const chainStatusBefore = await readChainStatus(Number(id));
    if (chainStatusBefore !== "received") {
      return {
        status: 409,
        body: {
          error: `Batch cannot be retired from chain status "${
            chainStatusBefore ?? "unknown"
          }"`,
        },
      };
    }
    txHash = await chainTxHash(BATCH_NFT.retireBatch(Number(id), key ?? ""));
  }

  return retireBatch(id, output, key, txHash);
}
