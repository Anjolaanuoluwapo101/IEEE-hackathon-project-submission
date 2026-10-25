"use client";

import Link from "next/link";
import { Batch } from "@/lib/data";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { MaterialBadge } from "./MaterialBadge";
import { TxLink } from "./TxLink";

interface BatchCardProps {
  batch: Batch;
  onClick?: () => void;
  showActions?: boolean;
  onConfirm?: () => void;
  onRetire?: () => void;
  onTransfer?: () => void;
}

export function BatchCard({ batch, onClick, showActions = false, onConfirm, onRetire, onTransfer }: BatchCardProps) {
  const statusVariants: Record<string, "available" | "claimed" | "pending" | "registered" | "recycled" | "in_transit" | "flagged" | "new"> = {
    registered: "registered",
    in_transit: "in_transit",
    received: "recycled",
    flagged: "flagged",
    retired: "recycled",
    pending: "pending",
  };

  const canConfirm = batch.status === "registered" && batch.recyclerId;
  const canRetire = batch.status === "received";
  const canTransfer = batch.status === "registered" && batch.aggregatorId;

  return (
    <article className="card p-5 hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/rec/batches/${batch.id}`}
              className="mono b8 text-ink hover:text-emerald truncate"
            >
              {batch.id}
            </Link>
            <MaterialBadge material={batch.material} size="sm" />
            <Badge variant={statusVariants[batch.status] || "pending"}>{batch.status.replace("_", " ")}</Badge>
          </div>
          <p className="text-muted text-sm mt-1">{batch.material}</p>
          <p className="b7 text-sm text-ink mt-0.5">{batch.loggedWeightKg} kg</p>
          {batch.recyclerId && (
            <p className="text-xs text-muted mt-0.5">Recycler: {batch.recyclerId}</p>
          )}
        </div>
        {showActions && (
          <div className="flex flex-col gap-2 ml-4 shrink-0">
            {canConfirm && onConfirm && (
              <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onConfirm(); }}>
                Confirm
              </Button>
            )}
            {canRetire && onRetire && (
              <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); onRetire(); }}>
                Retire
              </Button>
            )}
            {canTransfer && onTransfer && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onTransfer(); }}>
                Transfer
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

interface BatchTimelineProps {
  batch: Batch;
  isPublic?: boolean;
}

export function BatchTimeline({ batch, isPublic = false }: BatchTimelineProps) {
  const steps = [
    {
      key: "registered",
      label: "Registered",
      date: batch.createdAt,
      actor: batch.aggregatorId,
      txHash: batch.registerTx,
      completed: true,
    },
    {
      key: "transferred",
      label: "Transferred",
      date: batch.updatedAt,
      actor: batch.recyclerId,
      txHash: batch.transferTx,
      completed: !!batch.transferTx,
    },
    {
      key: "received",
      label: batch.mismatch?.flagged ? "Flagged" : "Received",
      date: batch.updatedAt,
      actor: batch.recyclerId,
      txHash: batch.confirmTx,
      completed: !!batch.confirmTx,
    },
    {
      key: "recycled",
      label: "Recycled",
      date: batch.retiredAt,
      actor: batch.recyclerId,
      txHash: batch.retireTx,
      completed: !!batch.retireTx,
    },
    {
      key: "certified",
      label: "Certified",
      date: batch.retirement?.retireTx ? batch.retiredAt : undefined,
      actor: undefined,
      txHash: undefined,
      completed: false,
    },
  ].filter((s) => s.completed || s.key === "certified");

  return (
    <div className="space-y-6">
      <h3 className="eye">Custody trail</h3>
      <div className="space-y-0">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-start gap-4">
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                  step.completed
                    ? "bg-emerald border-emerald"
                    : "border-line bg-white"
                }`}
                style={{ marginTop: "4px" }}
              />
              {index < steps.length - 1 && (
                <div className="w-1 h-full bg-line mt-2" />
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="b8 text-sm">{step.label}</div>
                  <div className="text-xs text-muted font-semibold mt-0.5">
                    {step.date ? new Date(step.date).toLocaleDateString(undefined, { day: "2-digit", month: "short" }) : "—"}
                    {step.actor && ` · ${step.actor}`}
                  </div>
                </div>
                {step.txHash && (
                  <TxLink txHash={step.txHash} />
                )}
              </div>
              {step.key === "received" && batch.mismatch && (
                <div className="mt-2 text-xs text-danger font-semibold">
                  Logged vs received weight difference: {batch.mismatch.deltaPct}% (tolerance {batch.mismatch.tolerancePct}%)
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}