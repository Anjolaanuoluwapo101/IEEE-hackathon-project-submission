import { NextResponse } from "next/server";
import { writeJsonFile } from "@/lib/store";
import {
  BATCHES_FILE,
  CERTIFICATES_FILE,
  INTAKES_FILE,
  LISTINGS_FILE,
  PAYOUTS_FILE,
} from "@/lib/data";
import { failure } from "@/lib/api-utils";
import { authorizeAdmin } from "@/lib/admin";

export async function POST(request: Request) {
  try {
    const admin = authorizeAdmin(request);
    if (admin.response) return admin.response;

    await writeJsonFile(BATCHES_FILE, []);
    await writeJsonFile(PAYOUTS_FILE, []);
    await writeJsonFile(CERTIFICATES_FILE, []);
    await writeJsonFile(INTAKES_FILE, []);
    await writeJsonFile(LISTINGS_FILE, []);

    return NextResponse.json({
      success: true,
      message: "Demo data reset",
      cleared: [
        BATCHES_FILE,
        PAYOUTS_FILE,
        CERTIFICATES_FILE,
        INTAKES_FILE,
        LISTINGS_FILE,
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return failure(err, "Reset failed");
  }
}
