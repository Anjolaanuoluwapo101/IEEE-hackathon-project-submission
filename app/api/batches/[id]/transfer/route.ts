import { NextResponse } from "next/server";
import { mutateJsonFile } from "@/lib/store";
import { BATCHES_FILE, readBatches, type Batch } from "@/lib/data";
import { failure, idempotencyKey } from "@/lib/api-utils";
import { authorizeApi } from "@/lib/api-auth";
import { isAccountOfRole } from "@/lib/authz";
import { demoTx } from "@/lib/demo";
import {
  BATCH_NFT,
  requireSigner,
  chainTxHash,
  readChainStatus,
} from "@/lib/chain";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeApi("aggregator");
    if (auth.response) return auth.response;
    const session = auth.session;

    const { id } = await params;
    const tokenId = Number(id);
    const body = await req.json();
    const { recyclerId } = body;

    if (!isAccountOfRole(recyclerId, "recycler")) {
      return NextResponse.json(
        { error: "recyclerId must reference a seeded recycler account" },
        { status: 400 }
      );
    }

    const batches = await readBatches();
    const batch = batches.find((item) => item.id === id);

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    if (batch.aggregatorId !== session.id) {
      return NextResponse.json(
        { error: "Only the owning aggregator can transfer this batch" },
        { status: 403 }
      );
    }

    if (batch.status !== "registered") {
      return NextResponse.json(
        {
          error: `Batch cannot be transferred from status "${batch.status}"`,
        },
        { status: 409 }
      );
    }

    const chainStatusBefore = batch.demo
      ? "registered"
      : await readChainStatus(tokenId);
    if (chainStatusBefore !== "registered") {
      return NextResponse.json(
        {
          error: `Batch cannot be transferred from chain status "${
            chainStatusBefore ?? "unknown"
          }"`,
        },
        { status: 409 }
      );
    }

    const key = idempotencyKey(req);
    const now = new Date().toISOString();

    let replay = false;

    const list = await mutateJsonFile<Batch[]>(BATCHES_FILE, [], async (current) => {
      const target = current.find((item) => item.id === id);
      if (!target) return current;

      if (target.aggregatorId !== session.id) return current;

      if (target.transferKey && key && target.transferKey === key) {
        replay = true;
        return current;
      }

      if (target.status !== "registered") {
        return current;
      }

      let txHash: string;

      if (target.demo) {
        txHash = demoTx("transfer", id);
      } else {
        const signer = requireSigner();
        txHash = await chainTxHash(
          BATCH_NFT.transferToRecycler(tokenId, signer.address, key ?? "")
        );
      }

      target.recyclerId = recyclerId;
      target.status = "in_transit";
      target.transferTx = txHash;
      target.transferKey = key;
      target.updatedAt = now;
      return current;
    });

    const saved = list.find((item) => item.id === id);
    if (!saved) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      idempotent: replay,
      batchId: saved.id,
      recyclerId: saved.recyclerId,
      status: saved.status,
      transferTx: saved.transferTx ?? null,
      batch: saved,
    });
  } catch (err) {
    return failure(err, "Transfer failed");
  }
}
