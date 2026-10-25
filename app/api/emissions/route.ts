import { NextResponse } from "next/server";
import { getEmissionsFactors } from "@/lib/store";

export async function GET() {
  try {
    const data = await getEmissionsFactors();
    if (!data) {
      return NextResponse.json({ error: "Emissions factors not available" }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("Emissions factors error:", err);
    return NextResponse.json({ error: "Failed to load emissions factors" }, { status: 500 });
  }
}
