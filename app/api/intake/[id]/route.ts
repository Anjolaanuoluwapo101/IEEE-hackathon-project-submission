import { NextResponse } from "next/server";
import { getGist, readJsonFile } from "@/lib/store";
import { INTAKES_FILE, type Intake } from "@/lib/data";
import { failure } from "@/lib/api-utils";
import { authorizeApi } from "@/lib/api-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeApi("picker", "aggregator");
    if (auth.response) return auth.response;

    const { id } = await params;

    const intakes = await readJsonFile<Intake[]>(INTAKES_FILE, []);
    let intake = intakes.find((i) => i.id === id);

    if (!intake) {
      const gist = await getGist();
      const files = gist?.files as
        | Record<string, { content?: string }>
        | undefined;
      const legacyKey = files
        ? Object.keys(files).find((key) => key.endsWith(`_${id}.json`))
        : undefined;
      if (legacyKey && files?.[legacyKey]?.content) {
        intake = JSON.parse(files[legacyKey].content) as Intake;
      }
    }

    if (!intake) {
      return NextResponse.json({ error: "Intake not found" }, { status: 404 });
    }

    if (auth.session.role === "picker" && intake.pickerId !== auth.session.id) {
      return NextResponse.json(
        { error: "This intake belongs to another picker" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      intake: {
        id: intake.id,
        pickerId: intake.pickerId,
        material: intake.aiResult?.material,
        confidence: intake.aiResult?.confidence,
        estimatedPricePerKg: intake.aiResult?.valueEstimate,
        sortingAdvice: intake.aiResult?.sortingAdvice,
        nearestBuyer: intake.aiResult?.nearestBuyer,
        status: intake.status,
        createdAt: intake.createdAt,
      },
    });
  } catch (err) {
    return failure(err, "Failed to poll intake");
  }
}
