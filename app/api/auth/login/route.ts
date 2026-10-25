import { NextResponse } from "next/server";
import { findDemoAccount } from "@/lib/demo-users";
import {
  createSessionToken,
  ROLE_HOME,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const accountId = body?.accountId;

  if (typeof accountId !== "string") {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }

  const account = findDemoAccount(accountId);
  if (!account) {
    return NextResponse.json({ error: "Unknown demo account" }, { status: 404 });
  }

  const token = await createSessionToken(account.id, account.role);
  const response = NextResponse.json({
    success: true,
    role: account.role,
    home: ROLE_HOME[account.role],
    account: {
      id: account.id,
      name: account.name,
      org: account.org,
      role: account.role,
    },
  });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
