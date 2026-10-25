import { findDemoAccount } from "./demo-users";
import type { Batch, Role } from "./data";
import type { SessionUser } from "./session";

export function isBatchVisibleTo(session: SessionUser, batch: Batch): boolean {
  switch (session.role) {
    case "picker":
      return batch.pickerId === session.id;
    case "aggregator":
      return batch.aggregatorId === session.id;
    case "recycler":
      return batch.recyclerId === session.id;
    case "producer":
      return batch.status === "retired";
    default:
      return false;
  }
}

export function scopeBatchesForSession(
  session: SessionUser,
  batches: Batch[]
): Batch[] {
  return batches.filter((batch) => isBatchVisibleTo(session, batch));
}

export function isAccountOfRole(id: unknown, role: Role): boolean {
  if (typeof id !== "string") return false;
  const account = findDemoAccount(id);
  return account?.role === role;
}

export function ownsBatchAs(
  session: SessionUser,
  batch: Batch,
  role: Role
): boolean {
  if (session.role !== role) return false;
  if (role === "aggregator") return batch.aggregatorId === session.id;
  if (role === "recycler") return batch.recyclerId === session.id;
  if (role === "picker") return batch.pickerId === session.id;
  return false;
}
