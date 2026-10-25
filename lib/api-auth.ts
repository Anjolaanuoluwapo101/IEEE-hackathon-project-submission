import { NextResponse } from "next/server";
import { getSession } from "./auth";
import type { Role } from "./data";
import type { SessionUser } from "./session";

export type ApiAuthResult =
  | { session: SessionUser; response?: undefined }
  | { response: NextResponse; session?: undefined };

export async function authorizeApi(...roles: Role[]): Promise<ApiAuthResult> {
  const session = await getSession();

  if (!session) {
    return {
      response: NextResponse.json({ error: "Sign in required" }, { status: 401 }),
    };
  }

  if (roles.length > 0 && !roles.includes(session.role)) {
    return {
      response: NextResponse.json(
        { error: "This action is not available for your role" },
        { status: 403 }
      ),
    };
  }

  return { session };
}
