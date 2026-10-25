import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicTrail } from "@/lib/analytics";
import { AnchorButton, Button } from "@/components/ui/Button";
import { Card, DarkPanel, StatTile } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TxLink } from "@/components/ui/TxLink";

interface Props {
  params: Promise<{ certificateId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { certificateId } = await params;
  return {
    title: `${certificateId} - CircuLagos Verification`,
    description: `Verify carbon credit certificate ${certificateId}`,
  };
}

export default async function VerifyResultPage({ params }: Props) {
  const { certificateId } = await params;
  const trail = await getPublicTrail(certificateId);

  if (!trail) notFound();

  const { batch, certificate, isClaimed } = trail;

  const materialTotals: Record<string, number> = {};
  if (certificate?.totalsByMaterial) {
    Object.entries(certificate.totalsByMaterial).forEach(([material, tonnes]) => {
      materialTotals[material] = tonnes;
    });
  }

  const includedBatch = batch && batch.status === "retired" ? batch : null;

  return (
    <div className="f" style={{ minHeight: "1000px", background: "var(--color-bg-primary)" }}>
      <header className="row" style={{ justifyContent: "space-between", padding: "18px 48px", background: "var(--color-card)", borderBottom: "1px solid var(--color-line)" }}>
        <div className="row" style={{ fontWeight: 800, fontSize: "19px", letterSpacing: "-0.02em" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(140deg,#17B873,#075236)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 16px -8px #0A7A4E" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10zM2 21c0-3 1.9-5.5 6-7" />
            </svg>
            <span>CircuLagos</span>
          </div>
        </div>
        <Badge variant="available">Public page</Badge>
      </header>

      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 32px" }}>
        <DarkPanel padding="lg">
          <div className="row" style={{ gap: "14px" }}>
            <div className="lime" style={{ width: "44px", height: "44px", margin: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#07130E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <div className="d" style={{ fontSize: "40px" }}>Verified on-chain</div>
              <div style={{ color: "#BFF3D8", fontWeight: 600, fontSize: "14px", marginTop: "4px" }}>
                {certificate?.id} · issued {certificate?.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString() : "—"} to {certificate?.producerId ?? "Unknown Producer"}
              </div>
            </div>
          </div>
        </DarkPanel>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "16px" }}>
          <StatTile label="PET" value={materialTotals.pet ?? 0} subtext="kg" variant="light" />
          <StatTile label="HDPE" value={materialTotals.hdpe ?? 0} subtext="kg" variant="light" />
          <StatTile label="Alu" value={materialTotals.aluminum ?? materialTotals["aluminium"] ?? 0} subtext="kg" variant="light" />
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "16px", alignItems: "start", marginTop: "16px" }}>
          <div>
            <Card padding="lg" style={{ marginTop: "16px", overflow: "hidden" }}>
              <div className="eye" style={{ padding: "20px 20px 12px" }}>Included batches</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-line)", textAlign: "left", color: "var(--color-muted)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    <th style={{ padding: "14px 20px", textAlign: "left" }}>Batch</th>
                    <th style={{ padding: "14px 20px", textAlign: "left" }}>Material</th>
                    <th style={{ padding: "14px 20px", textAlign: "left" }}>Weight</th>
                    <th style={{ padding: "14px 20px", textAlign: "left" }}>Retired</th>
                    <th style={{ padding: "14px 20px", textAlign: "left" }}>Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {includedBatch && (
                    <tr style={{ borderBottom: "1px solid var(--color-line-light)" }}>
                      <td style={{ padding: "14px 20px", fontFamily: "var(--font-mono)", color: "var(--color-ink)", fontWeight: 700 }}>{includedBatch.id}</td>
                      <td style={{ padding: "14px 20px" }}><strong>{includedBatch.material}</strong></td>
                      <td style={{ padding: "14px 20px", color: "var(--color-text-primary)" }}>{includedBatch.receivedWeightKg ?? includedBatch.loggedWeightKg} kg</td>
                      <td style={{ padding: "14px 20px", color: "var(--color-muted)" }}>{includedBatch.retiredAt ? new Date(includedBatch.retiredAt).toLocaleDateString() : "—"}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <a href={`https://www.oklink.com/amoy/tx/${includedBatch.retireTx}`} target="_blank" rel="noopener noreferrer" className="mono" style={{ color: "var(--color-emerald)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          {includedBatch.retireTx ? `${includedBatch.retireTx.slice(0, 6)}…${includedBatch.retireTx.slice(-4)}` : "—"}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          </div>
          <aside style={{ marginTop: "16px" }}>
            <Card padding="lg" style={{ textAlign: "center" }}>
              <div className="eye">Scan to verify</div>
              <div style={{ margin: "14px 0" }}>
                <div style={{ width: "120px", height: "120px", margin: "0 auto", background: "var(--color-line)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-muted)" }}>
                  [QR Code]
                </div>
              </div>
              <div className="mono" style={{ color: "var(--color-muted)" }}>Certificate transaction</div>
              <a href={`https://www.oklink.com/amoy/tx/${trail.batch?.retireTx ?? "—"}`} target="_blank" rel="noopener noreferrer" className="mono" style={{ color: "var(--color-emerald)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                {trail.batch?.retireTx ? `${trail.batch.retireTx.slice(0, 6)}…${trail.batch.retireTx.slice(-4)}` : "—"}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </Card>
          </aside>
        </section>
      </main>
    </div>
  );
}