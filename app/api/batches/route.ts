import { NextResponse } from "next/server";
import { mutateJsonFile } from "@/lib/store";
import {
  BATCHES_FILE,
  readBatches,
  readCertificates,
  readIntakes,
  type Batch,
  type IntakeAiResult,
} from "@/lib/data";
import { failure, idempotencyKey } from "@/lib/api-utils";
import { authorizeApi } from "@/lib/api-auth";
import { isAccountOfRole, scopeBatchesForSession } from "@/lib/authz";
import { normalizeMaterial } from "@/lib/materials";
import { BATCH_NFT, requireSigner } from "@/lib/chain";
import { demoTx } from "@/lib/demo";
import { isDemoMode } from "@/lib/mode";

const HASH_PATTERN = /^[a-f0-9]{64}$/;

function isHttpOrRelative(url: string): boolean {
  return /^(https?:\/\/|\/)/.test(url);
}

export async function GET(req: Request) {
  try {
    const auth = await authorizeApi();
    if (auth.response) return auth.response;
    const session = auth.session;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let batches = scopeBatchesForSession(session, await readBatches());

    if (status) batches = batches.filter((batch) => batch.status === status);

    batches = batches
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    if (session.role === "producer") {
      const certificates = await readCertificates();
      const claimedBatchIds = [
        ...new Set(certificates.flatMap((certificate) => certificate.batchIds)),
      ];
      return NextResponse.json({ success: true, batches, claimedBatchIds });
    }

    return NextResponse.json({ success: true, batches });
  } catch (err) {
    return failure(err, "Failed to list batches");
  }
}

export async function POST(req: Request) {
  try {
    const auth = await authorizeApi("aggregator");
    if (auth.response) return auth.response;
    const session = auth.session;

    const body = await req.json();
    const {
      pickerId,
      loggedWeightKg,
      location,
      photoHash,
      intakeId,
      evidenceUrls,
    } = body ?? {};

    const weight = Number(loggedWeightKg);

    if (!pickerId || !location) {
      return NextResponse.json(
        { error: "Missing required fields: pickerId, location" },
        { status: 400 }
      );
    }

    if (!isAccountOfRole(pickerId, "picker")) {
      return NextResponse.json(
        { error: "pickerId must reference a seeded picker account" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(weight) || weight <= 0) {
      return NextResponse.json(
        { error: "loggedWeightKg must be a positive number" },
        { status: 400 }
      );
    }

    let material = normalizeMaterial(body?.material);
    let linkedIntake: {
      imageUrls?: string[];
      imageHashes?: string[];
      imageSources?: string[];
      aiResult?: IntakeAiResult | null;
      pickerId?: string;
      location?: string;
    } | null = null;

    if (intakeId) {
      const intakes = await readIntakes();
      linkedIntake = intakes.find((intake) => intake.id === intakeId) ?? null;
      if (!linkedIntake) {
        return NextResponse.json(
          { error: `Intake "${intakeId}" not found` },
          { status: 404 }
        );
      }
      if (linkedIntake.pickerId !== pickerId) {
        return NextResponse.json(
          { error: "Intake belongs to a different picker" },
          { status: 409 }
        );
      }
    }

    if (!material && linkedIntake?.aiResult?.material) {
      material = normalizeMaterial(linkedIntake.aiResult.material);
    }
    if (!material) {
      return NextResponse.json(
        { error: "Unknown material. Provide a supported material value." },
        { status: 400 }
      );
    }

    const resolvedHash =
      (typeof photoHash === "string" && photoHash.trim()) ||
      linkedIntake?.imageHashes?.[0] ||
      "";

    if (!resolvedHash) {
      return NextResponse.json(
        { error: "photoHash is required (upload photos first)" },
        { status: 400 }
      );
    }
    if (!HASH_PATTERN.test(resolvedHash)) {
      return NextResponse.json(
        { error: "photoHash must be a 64-character SHA-256 hash" },
        { status: 400 }
      );
    }

    const resolvedUrls = Array.isArray(evidenceUrls)
      ? evidenceUrls.filter(
          (url: unknown): url is string =>
            typeof url === "string" && isHttpOrRelative(url)
        )
      : linkedIntake?.imageUrls ?? [];

    const evidenceSource =
      linkedIntake?.imageSources?.[0] === "sample" ? "sample" : "upload";

    const resolvedEvidence = linkedIntake?.aiResult ?? null;

    const key = idempotencyKey(req);
    const now = new Date().toISOString();

    let replay = false;
    let conflictBatchId: string | null = null;

    const list = await mutateJsonFile<Batch[]>(BATCHES_FILE, [], async (current) => {
      if (key) {
        const byKey = current.find((batch) => batch.idempotencyKey === key);
        if (byKey) {
          replay = true;
          return current;
        }
      }

      const storeClash = current.find(
        (batch) =>
          batch.photoHash === resolvedHash && batch.evidenceSource !== "sample"
      );
      if (storeClash) {
        conflictBatchId = storeClash.id;
        return current;
      }

      let batchId: string;
      let registerTx: string;

      if (isDemoMode()) {
        batchId = `demo-batch-${Date.now().toString(36)}${Math.random()
          .toString(36)
          .slice(2, 6)}`;
        registerTx = demoTx("register", batchId);
      } else {
        const signer = requireSigner();

        const tx = await BATCH_NFT.registerBatch(
          signer.address,
          signer.address,
          material,
          Math.round(weight),
          location,
          resolvedHash,
          key ?? ""
        );
        const receipt = await tx.wait();
        const tokenIdBig = await BATCH_NFT.photoHashToTokenId(resolvedHash);
        batchId = String(Number(tokenIdBig));
        registerTx = receipt.hash;
      }

      const batchRecord: Batch = {
        id: batchId,
        pickerId,
        aggregatorId: session.id,
        recyclerId: null,
        demo: isDemoMode() || undefined,
        material,
        location,
        loggedWeightKg: weight,
        receivedWeightKg: null,
        status: "registered",
        photoHash: resolvedHash,
        evidenceUrls: resolvedUrls,
        evidenceSource,
        intakeId: intakeId ?? null,
        aiEvidence: resolvedEvidence,
        registerTx,
        transferTx: null,
        confirmTx: null,
        retireTx: null,
        idempotencyKey: key,
        createdAt: now,
        updatedAt: now,
      };

      current.push(batchRecord);
      return current;
    });

    if (conflictBatchId) {
      return NextResponse.json(
        {
          error: "This photo was already registered to a batch",
          existingBatchId: conflictBatchId,
        },
        { status: 409 }
      );
    }

    const saved =
      list.find((batch) => batch.idempotencyKey === key) ??
      list.find((batch) => batch.photoHash === resolvedHash) ??
      null;

    if (!saved) {
      return NextResponse.json(
        { error: "Batch could not be saved" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, idempotent: replay, batch: saved },
      { status: replay ? 200 : 201 }
    );
  } catch (err) {
    return failure(err, "Failed to register batch");
  }
}
