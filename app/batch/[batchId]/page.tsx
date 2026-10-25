import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicTrail } from "@/lib/analytics";
import { Badge } from "@/components/ui/Badge";
import { TxLink } from "@/components/ui/TxLink";

interface Props {
  params: Promise<{ batchId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { batchId } = await params;
  return {
    title: `${batchId} - Public Batch Trail`,
    description: `View the custody trail for batch ${batchId}`,
  };
}

export default async function BatchTrailPage({ params }: Props) {
  const { batchId } = await params;
  const trail = await getPublicTrail(batchId);

  if (!trail) notFound();

  const { batch, certificate, trail: custodyTrail, isClaimed } = trail;

  return (
    <div className="f" style={{ minHeight: "900px", background: "var(--color-bg-primary)" }}>
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
        <div className="eye" style={{ color: "var(--color-emerald)" }}>Public batch trail</div>
        <h1 className="d" style={{ fontSize: "48px", margin: "6px 0 6px" }}>{batch.id}</h1>
        <p style={{ margin: "0 0 24px", fontSize: "16px", color: "var(--color-muted)" }}>
          {batch.receivedWeightKg ?? batch.loggedWeightKg} kg {batch.material}
        </p>

        {isClaimed && (
          <div className="dark" style={{ padding: "28px" }}>
            <div className="d" style={{ fontSize: "36px" }}>Retired, already claimed</div>
            <div style={{ color: "#BFF3D8", fontWeight: 600, marginTop: "6px" }}>
              This batch is part of certificate {certificate?.id} and can&apos;t be claimed again.
            </div>
          </div>
        )}

        <div className="card" style={{ padding: "24px", marginTop: "16px" }}>
          <div className="eye">Custody trail</div>
          <div style={{ marginTop: "16px" }}>
            {custodyTrail.map((step, index) => (
              <div key={index} className="row" style={{ alignItems: "flexStart", gap: "14px", paddingBottom: index === custodyTrail.length - 1 ? 0 : "18px" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "3px solid var(--color-emerald)", background: step.txHash ? "var(--color-emerald)" : "var(--color-card)", borderColor: step.txHash ? "var(--color-emerald)" : "var(--color-line)", marginTop: "3px", flexShrink: 0 }} />
                <div className="flex-1">
                  <div className="b8" style={{ fontSize: "15px" }}>{step.label}</div>
                  <div style={{ fontSize: "13px", color: "var(--color-muted)", fontWeight: 600 }}>
                    {step.date ? new Date(step.date).toLocaleDateString(undefined, { day: "2-digit", month: "short" }) : "—"}
                    {step.actor && ` · ${step.actor}`}
                  </div>
                </div>
                {step.txHash && (
                  <a href={`https://www.oklink.com/amoy/tx/${step.txHash}`} target="_blank" rel="noopener noreferrer" className="mono" style={{ color: "var(--color-emerald)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    {step.txHash.slice(0, 6)}…{step.txHash.slice(-4)}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}