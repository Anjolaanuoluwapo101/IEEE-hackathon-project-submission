import { Metadata } from "next";
import { notFound } from "next/navigation";
import { readBatches, readCertificates } from "@/lib/data";
import { AnchorButton, Button } from "@/components/ui/Button";
import { Card, DarkPanel } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MaterialBadge } from "@/components/ui/MaterialBadge";
import { TxLink } from "@/components/ui/TxLink";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Batch ${id} - Aggregator`,
    description: `Batch detail for ${id}`,
  };
}

export default async function AggBatchDetailPage({ params }: Props) {
  const { id } = await params;
  const [batches, certificates] = await Promise.all([readBatches(), readCertificates()]);
  const batch = batches.find((b) => b.id === id);

  if (!batch) notFound();

  const isClaimed = certificates.some((c) => c.batchIds.includes(id));
  const canTransfer = batch.status === "registered" && batch.aggregatorId;
  const canFlag = batch.status === "received" && batch.recyclerId;
  const isFlagged = batch.mismatch?.flagged;

  return (
    <div className="f" style={{ display: "flex", minHeight: "820px", background: "var(--color-bg-primary)" }}>
      <aside data-cl-sidebar data-role="aggregator" data-active="1" />
      <main style={{ flex: 1, minWidth: 0, padding: "36px 48px" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flexEnd" }}>
          <div>
            <div className="eye" style={{ color: "var(--color-emerald)" }}>Aggregator</div>
            <h1 className="d" style={{ fontSize: "48px", margin: "6px 0 6px" }}>{batch.id}</h1>
            <p style={{ margin: 0, fontSize: "16px", color: "var(--color-muted)" }}>
              {batch.material} · {batch.loggedWeightKg} kg · {batch.status.replace("_", " ")}
            </p>
          </div>
          <div className="row">
            <Badge variant={
              batch.status === "registered" ? "registered" :
              batch.status === "in_transit" ? "in_transit" :
              batch.status === "received" ? "recycled" :
              batch.status === "flagged" ? "flagged" :
              batch.status === "retired" ? "recycled" : "pending"
            }>{batch.status.replace("_", " ")}</Badge>
          </div>
        </div>

        <div style={{ marginTop: "28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <DarkPanel padding="lg" style={{ minHeight: "360px" }}>
            <div className="eye">Evidence from the picker&apos;s scan</div>
            <div style={{ marginTop: "16px", height: "240px", background: "var(--color-line)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-muted)" }}>
              [Photo + AI classification]
            </div>
            <div className="eye" style={{ marginTop: "24px" }}>Batch info</div>
            <table style={{ width: "100%", marginTop: "12px", borderCollapse: "collapse" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--color-line-light)" }}>
                  <td style={{ padding: "8px 0", color: "var(--color-muted)" }}>Material</td>
                  <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 700 }}><MaterialBadge material={batch.material} size="sm" /></td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--color-line-light)" }}>
                  <td style={{ padding: "8px 0", color: "var(--color-muted)" }}>Logged weight</td>
                  <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 700 }}>{batch.loggedWeightKg} kg</td>
                </tr>
                {batch.receivedWeightKg && (
                  <tr style={{ borderBottom: "1px solid var(--color-line-light)" }}>
                    <td style={{ padding: "8px 0", color: "var(--color-muted)" }}>Received weight</td>
                    <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 700 }}>{batch.receivedWeightKg} kg</td>
                  </tr>
                )}
                <tr style={{ borderBottom: "1px solid var(--color-line-light)" }}>
                  <td style={{ padding: "8px 0", color: "var(--color-muted)" }}>Location</td>
                  <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 700 }}>{batch.location}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--color-line-light)" }}>
                  <td style={{ padding: "8px 0", color: "var(--color-muted)" }}>Picker</td>
                  <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 700 }}>{batch.pickerId}</td>
                </tr>
              </tbody>
            </table>
          </DarkPanel>

          <Card padding="lg">
            <div className="eye">Custody</div>
            <div style={{ marginTop: "16px" }}>
              <div className="row" style={{ alignItems: "flexStart", gap: "14px", paddingBottom: "18px" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "3px solid var(--color-emerald)", background: "var(--color-emerald)", marginTop: "3px", flexShrink: 0 }} />
                <div className="flex-1">
                  <div className="b8" style={{ fontSize: "15px" }}>Registered</div>
                  <div style={{ fontSize: "13px", color: "var(--color-muted)", fontWeight: 600 }}>{batch.createdAt ? new Date(batch.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short" }) : "—"} · {batch.aggregatorId}</div>
                </div>
                {batch.registerTx && <TxLink txHash={batch.registerTx} />}
              </div>
              {batch.transferTx && (
                <div className="row" style={{ alignItems: "flexStart", gap: "14px", paddingBottom: "18px" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "3px solid var(--color-emerald)", background: "var(--color-emerald)", marginTop: "3px", flexShrink: 0 }} />
                  <div className="flex-1">
                    <div className="b8" style={{ fontSize: "15px" }}>Transferred</div>
                    <div style={{ fontSize: "13px", color: "var(--color-muted)", fontWeight: 600 }}>{batch.updatedAt ? new Date(batch.updatedAt).toLocaleDateString(undefined, { day: "2-digit", month: "short" }) : "—"} · to {batch.recyclerId}</div>
                  </div>
                  <TxLink txHash={batch.transferTx} />
                </div>
              )}
              {batch.confirmTx && (
                <div className="row" style={{ alignItems: "flexStart", gap: "14px", paddingBottom: "18px" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "3px solid var(--color-emerald)", background: "var(--color-emerald)", marginTop: "3px", flexShrink: 0 }} />
                  <div className="flex-1">
                    <div className="b8" style={{ fontSize: "15px" }}>{batch.mismatch?.flagged ? "Flagged" : "Received"}</div>
                    <div style={{ fontSize: "13px", color: "var(--color-muted)", fontWeight: 600 }}>{batch.updatedAt ? new Date(batch.updatedAt).toLocaleDateString(undefined, { day: "2-digit", month: "short" }) : "—"} · {batch.receivedWeightKg ? `${batch.receivedWeightKg} kg, ${batch.mismatch?.deltaPct}% diff` : "confirmed"}</div>
                  </div>
                  <TxLink txHash={batch.confirmTx} />
                </div>
              )}
              {batch.retireTx && (
                <div className="row" style={{ alignItems: "flexStart", gap: "14px", paddingBottom: "18px" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "3px solid var(--color-emerald)", background: "var(--color-emerald)", marginTop: "3px", flexShrink: 0 }} />
                  <div className="flex-1">
                    <div className="b8" style={{ fontSize: "15px" }}>Recycled</div>
                    <div style={{ fontSize: "13px", color: "var(--color-muted)", fontWeight: 600 }}>{batch.retiredAt ? new Date(batch.retiredAt).toLocaleDateString(undefined, { day: "2-digit", month: "short" }) : "—"} · retired</div>
                  </div>
                  <TxLink txHash={batch.retireTx} />
                </div>
              )}
              {batch.retirement?.retireTx && (
                <div className="row" style={{ alignItems: "flexStart", gap: "14px", paddingBottom: 0 }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "3px solid var(--color-emerald)", background: "var(--color-emerald)", marginTop: "3px", flexShrink: 0 }} />
                  <div className="flex-1">
                    <div className="b8" style={{ fontSize: "15px" }}>Certified</div>
                    <div style={{ fontSize: "13px", color: "var(--color-muted)", fontWeight: 600 }}>{batch.retirement.retiredAt ? new Date(batch.retirement.retiredAt).toLocaleDateString(undefined, { day: "2-digit", month: "short" }) : "—"} · certified</div>
                  </div>
                  <TxLink txHash={batch.retirement.retireTx} />
                </div>
              )}
            </div>
          </Card>
        </div>

        <div style={{ marginTop: "24px" }}>
          <Card padding="lg">
            <div className="eye">Action area</div>
            <div style={{ marginTop: "16px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {canTransfer && (
                <Button variant="brand" onClick={() => window.location.href = `/agg/batches/${batch.id}/transfer`}>
                  Transfer to recycler<span className="lime"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span>
                </Button>
              )}
              {canFlag && (
                <Button variant="secondary" onClick={() => window.location.href = `/agg/batches/${batch.id}/flag`}>
                  Flag batch
                </Button>
              )}
              {batch.status === "retired" && !isClaimed && (
                <AnchorButton variant="ghost" href="/prod/batches">View in verified pool</AnchorButton>
              )}
              {isClaimed && (
                <Badge variant="claimed">Already certified</Badge>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

