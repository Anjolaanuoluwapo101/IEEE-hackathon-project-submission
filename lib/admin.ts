import { NextResponse } from "next/server";

export type AdminAuthResult =
  | { response: NextResponse; allowed?: undefined }
  | { allowed: true; response?: undefined };

export function authorizeAdmin(request: Request): AdminAuthResult {
  const expected = process.env.ADMIN_RESET_TOKEN;
  if (!expected) {
    return {
      response: NextResponse.json(
        { error: "ADMIN_RESET_TOKEN is not configured" },
        { status: 503 }
      ),
    };
  }

  const bearer = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  const provided = request.headers.get("x-admin-token")?.trim() ?? bearer;

  if (!provided || provided !== expected) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { allowed: true };
}
