import { NextResponse } from "next/server";
import { mutateJsonFile } from "@/lib/store";
import {
  INTAKES_FILE,
  getPricePerKg,
  readBatches,
  readIntakes,
  type Intake,
  type IntakeAiResult,
} from "@/lib/data";
import { failure, idempotencyKey } from "@/lib/api-utils";
import { authorizeApi } from "@/lib/api-auth";
import { isAccountOfRole } from "@/lib/authz";
import { IMAGE_LIMITS } from "@/lib/config";
import { normalizeMaterial } from "@/lib/materials";
import { sampleImage } from "@/lib/storage";

const KEYWORDS: Array<{ match: string[]; material: string }> = [
  { match: ["pet", "bottle", "water bottle"], material: "pet" },
  { match: ["hdpe", "detergent", "jerrycan"], material: "hdpe" },
  { match: ["paper", "cardboard", "carton"], material: "paper" },
  { match: ["glass", "jar"], material: "glass" },
  { match: ["metal", "aluminium", "aluminum", "can", "scrap"], material: "metal" },
  { match: ["organic", "food", "compost"], material: "organic" },
  { match: ["e-waste", "ewaste", "electronic", "phone", "battery"], material: "e_waste" },
  { match: ["tire", "tyre"], material: "tires" },
  { match: ["plastic", "nylon", "sachet", "bag"], material: "plastic" },
];

const SORTING_ADVICE: Record<string, string> = {
  pet: "Rinse and remove caps. Keep bottles dry and flatten them to save space.",
  hdpe: "Empty and rinse containers. Separate coloured HDPE where possible.",
  paper: "Keep paper dry and flat. Remove tape and plastic film before baling.",
  glass: "Separate by colour. Handle carefully and remove metal lids.",
  metal: "Rinse cans, crush them, and keep ferrous and non-ferrous metals apart.",
  aluminum: "Rinse and crush cans. Keep aluminium separate from steel.",
  organic: "Drain excess liquid and keep separate from dry recyclables.",
  e_waste: "Never burn or dismantle e-waste. Keep batteries separate and dry.",
  tires: "Store away from heat. Do not burn tyres under any circumstances.",
  plastic: "Remove food residue and dry the material before bagging.",
  general_mixed_recyclables:
    "Sort by material type, remove contamination, and keep the batch dry.",
};

const HASH_PATTERN = /^[a-f0-9]{64}$/;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function resolveMaterial(
  description: string,
  declared: unknown
): { material: string; confidence: number } {
  const text = `${description ?? ""}`.toLowerCase();

  let material = normalizeMaterial(declared);
  if (!material) {
    for (const rule of KEYWORDS) {
      if (rule.match.some((word) => text.includes(word))) {
        material = normalizeMaterial(rule.material);
        if (material) break;
      }
    }
  }

  const resolved = material ?? "general_mixed_recyclables";
  const confidence = 0.82 + (hashString(text + resolved) % 14) / 100;

  return { material: resolved, confidence: Math.round(confidence * 100) / 100 };
}

async function buildAiResult(
  description: string,
  declared: unknown
): Promise<IntakeAiResult> {
  const { material, confidence } = resolveMaterial(description, declared);
  const valueEstimate = await getPricePerKg(material);

  return {
    material,
    confidence,
    valueEstimate,
    sortingAdvice:
      SORTING_ADVICE[material] ?? SORTING_ADVICE.general_mixed_recyclables,
    nearestBuyer: { name: "Lagos Recycling Hub", distanceKm: 2.4 },
  };
}

export async function POST(req: Request) {
  try {
    const auth = await authorizeApi("picker");
    if (auth.response) return auth.response;
    const pickerId = auth.session.id;

    const body = await req.json();

    const {
      imageUrls,
      imageHashes,
      imageSources,
      location,
      description,
      material,
      sampleMaterial,
    } = body ?? {};

    if (!location || typeof location !== "string" || !location.trim()) {
      return NextResponse.json({ error: "location is required" }, { status: 400 });
    }

    // Accept either uploaded images or an explicit sample fallback.
    let urls: string[] = [];
    let hashes: string[] = [];
    let sources: string[] = [];

    if (sampleMaterial) {
      const sample = await sampleImage(sampleMaterial);
      urls = [sample.url];
      hashes = [sample.hash];
      sources = ["sample"];
    } else {
      if (!Array.isArray(imageUrls) || !Array.isArray(imageHashes)) {
        return NextResponse.json(
          {
            error:
              "Provide imageUrls and imageHashes (upload first) or sampleMaterial for the demo fallback",
          },
          { status: 400 }
        );
      }
      if (imageUrls.length === 0 || imageUrls.length !== imageHashes.length) {
        return NextResponse.json(
          { error: "imageUrls and imageHashes must be non-empty and the same length" },
          { status: 400 }
        );
      }
      if (imageUrls.length > IMAGE_LIMITS.maxFiles) {
        return NextResponse.json(
          { error: `At most ${IMAGE_LIMITS.maxFiles} images per intake` },
          { status: 400 }
        );
      }
      if (
        imageUrls.some((url: unknown) => typeof url !== "string" || !url.trim()) ||
        imageHashes.some(
          (hash: unknown) => typeof hash !== "string" || !HASH_PATTERN.test(hash)
        )
      ) {
        return NextResponse.json(
          { error: "Every image needs a URL and a 64-character SHA-256 hash" },
          { status: 400 }
        );
      }
      urls = imageUrls as string[];
      hashes = imageHashes as string[];
      sources = urls.map((_: string, index: number) =>
        (imageSources as unknown[] | undefined)?.[index] === "sample"
          ? "sample"
          : "upload"
      );
    }

    const aiResult = await buildAiResult(
      typeof description === "string" ? description : "",
      material ?? sampleMaterial
    );

    const key = idempotencyKey(req);
    const id = `intake-${Date.now()}`;

    const record: Intake = {
      id,
      pickerId: pickerId.trim(),
      imageUrls: urls,
      imageHashes: hashes,
      imageSources: sources,
      location: location.trim(),
      description: typeof description === "string" ? description : "",
      status: "classified",
      aiResult,
      createdAt: new Date().toISOString(),
    };

    let duplicateIntakeId: string | null = null;
    let duplicateReplay = false;

    const list = await mutateJsonFile<Intake[]>(INTAKES_FILE, [], (current) => {
      if (key && current.some((i) => i.idempotencyKey === key)) {
        duplicateReplay = true;
        return current;
      }

      if (!sampleMaterial) {
        const clash = current.find((existing) =>
          existing.imageHashes.some((hash) => hashes.includes(hash))
        );
        if (clash) {
          duplicateIntakeId = clash.id;
          return current;
        }
      }

      current.push({ ...record, idempotencyKey: key });
      return current;
    });

    if (duplicateIntakeId) {
      return NextResponse.json(
        {
          error: "This photo has already been scanned",
          duplicateOf: duplicateIntakeId,
        },
        { status: 409 }
      );
    }

    const saved =
      list.find((i) => i.id === id) ??
      (key ? list.find((i) => i.idempotencyKey === key) : undefined) ??
      null;

    if (!saved) {
      return NextResponse.json(
        { error: "Intake could not be saved" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, idempotent: duplicateReplay, intake: saved },
      { status: duplicateReplay ? 200 : 201 }
    );
  } catch (err) {
    return failure(err, "Failed to create intake");
  }
}

export async function GET(req: Request) {
  try {
    const auth = await authorizeApi("picker", "aggregator");
    if (auth.response) return auth.response;
    const session = auth.session;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    let intakes = await readIntakes();

    if (session.role === "picker") {
      intakes = intakes.filter((intake) => intake.pickerId === session.id);
    } else {
      const pickerId = searchParams.get("pickerId");
      if (!pickerId || !isAccountOfRole(pickerId, "picker")) {
        return NextResponse.json(
          { error: "pickerId must reference a seeded picker account" },
          { status: 400 }
        );
      }

      const batches = await readBatches();
      const registered = new Set(
        batches.map((batch) => batch.intakeId).filter(Boolean)
      );

      intakes = intakes.filter(
        (intake) =>
          intake.pickerId === pickerId && !registered.has(intake.id)
      );
    }

    if (id) intakes = intakes.filter((intake) => intake.id === id);
    intakes = intakes
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return NextResponse.json({ success: true, intakes });
  } catch (err) {
    return failure(err, "Failed to list intakes");
  }
}
