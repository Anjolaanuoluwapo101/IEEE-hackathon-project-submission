import { cookies } from "next/headers";
import { findDemoAccount } from "./demo-users";
import type { Role } from "./data";
import {
  SESSION_COOKIE,
  verifySessionToken,
  type SessionUser,
} from "./session";

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const account = findDemoAccount(payload.uid);
  if (!account || account.role !== payload.role) return null;

  return {
    id: account.id,
    name: account.name,
    role: account.role,
    org: account.org,
    area: account.area,
    walletAddress: account.walletAddress,
  };
}

export async function getRoleSession(roles: Role[]): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;
  return roles.includes(session.role) ? session : null;
}
