import { NextResponse } from "next/server";
import { seedDemoData } from "@/lib/seed";
import { failure } from "@/lib/api-utils";
import { authorizeAdmin } from "@/lib/admin";

export async function POST(request: Request) {
  try {
    const admin = authorizeAdmin(request);
    if (admin.response) return admin.response;

    const counts = await seedDemoData();

    return NextResponse.json({
      success: true,
      message: "Demo data seeded",
      counts,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return failure(err, "Seed failed");
  }
}
