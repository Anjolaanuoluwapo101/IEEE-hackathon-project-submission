import { NextResponse } from "next/server";
import { mutateJsonFile } from "@/lib/store";
import { BATCHES_FILE, readBatches, type Batch } from "@/lib/data";
import { failure } from "@/lib/api-utils";
import { authorizeApi } from "@/lib/api-auth";
import { isBatchVisibleTo } from "@/lib/authz";
import { readChainStatus } from "@/lib/chain";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeApi();
    if (auth.response) return auth.response;
    const session = auth.session;

    const { id } = await params;
    const batches = await readBatches();
    const batch = batches.find((item) => item.id === id);

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    if (!isBatchVisibleTo(session, batch)) {
      return NextResponse.json(
        { error: "This batch belongs to another account" },
        { status: 403 }
      );
    }

    let reconciled = batch;

    if (/^\d+$/.test(id)) {
      const chainStatus = await readChainStatus(Number(id));
      if (chainStatus && chainStatus !== batch.status) {
        await mutateJsonFile<Batch[]>(BATCHES_FILE, [], (current) => {
          const target = current.find((item) => item.id === id);
          if (!target || target.status === chainStatus) return current;
          target.status = chainStatus as Batch["status"];
          target.updatedAt = new Date().toISOString();
          return current;
        });
        reconciled = { ...batch, status: chainStatus as Batch["status"] };
      }
    }

    return NextResponse.json({ success: true, batch: reconciled });
  } catch (err) {
    return failure(err, "Failed to fetch batch detail");
  }
}
