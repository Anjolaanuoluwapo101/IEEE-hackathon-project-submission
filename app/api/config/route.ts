import { NextResponse } from "next/server";
import { getConfig } from "@/lib/store";

export async function GET() {
  try {
    const config = await getConfig();
    if (!config) {
      return NextResponse.json({ error: "Config not available" }, { status: 500 });
    }
    return NextResponse.json(config);
  } catch (err) {
    console.error("Config error:", err);
    return NextResponse.json({ error: "Failed to load config" }, { status: 500 });
  }
}
