import { NextResponse, type NextRequest } from "next/server";
import { findDemoAccount } from "./lib/demo-users";
import type { Role } from "./lib/data";
import {
  ROLE_HOME,
  SESSION_COOKIE,
  verifySessionToken,
} from "./lib/session";

const GUARDED_PREFIXES: Array<{ prefix: string; role: Role }> = [
  { prefix: "/scan", role: "picker" },
  { prefix: "/agg", role: "aggregator" },
  { prefix: "/rec", role: "recycler" },
  { prefix: "/prod", role: "producer" },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const guarded = GUARDED_PREFIXES.find(
    (entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`)
  );

  if (!guarded) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? await verifySessionToken(token) : null;
  const account = payload ? findDemoAccount(payload.uid) : null;

  if (!payload || !account || account.role !== payload.role) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(loginUrl);
  }

  if (account.role !== guarded.role) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = ROLE_HOME[account.role];
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/scan",
    "/scan/:path*",
    "/agg",
    "/agg/:path*",
    "/rec",
    "/rec/:path*",
    "/prod",
    "/prod/:path*",
  ],
};
