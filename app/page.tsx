import { Metadata } from "next";
import { getImpactStats } from "@/lib/analytics";
import { AnchorButton, Button } from "@/components/ui/Button";
import { Card, DarkPanel, StatTile } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CircuLagos - Every kilo of waste, verified",
  description: "Track recycling from the street to a certificate anyone can check",
};

export default async function LandingPage() {
  const stats = await getImpactStats();

  return (
    <div className="f" style={{ minHeight: "1500px", background: "var(--color-bg-primary)" }}>
      <header className="row" style={{ justifyContent: "space-between", padding: "18px 48px", background: "var(--color-card)", borderBottom: "1px solid var(--color-line)" }}>
        <div className="row" style={{ fontWeight: 800, fontSize: "19px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(140deg,#17B873,#075236)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 16px -8px #0A7A4E" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10zM2 21c0-3 1.9-5.5 6-7" />
            </svg>
            <span>CircuLagos</span>
          </div>
        </div>
        <nav className="row" style={{ gap: "28px", fontWeight: 700 }}>
          <Link href="#how-it-works" className="text-ink hover:text-emerald transition-colors">How it works</Link>
          <Link href="#impact" className="text-ink hover:text-emerald transition-colors">Impact</Link>
          <Link href="/verify" className="text-ink hover:text-emerald transition-colors">Verify</Link>
        </nav>
      </header>

      <main style={{ maxWidth: "1180px", margin: "0 auto", padding: "56px 48px" }}>
        <section style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "40px", alignItems: "center" }}>
          <div>
            <div className="eye" style={{ color: "var(--color-emerald)" }}>IEEE Climate Chain</div>
            <h1 className="d" style={{ fontSize: "68px", margin: "10px 0 14px" }}>Every kilo of waste, verified.</h1>
            <p style={{ margin: "0 0 24px", fontSize: "19px", color: "var(--color-muted)" }}>Track recycling from the street to a certificate anyone can check.</p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <AnchorButton variant="brand" size="lg" href="/login">Try the demo<span className="lime"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span></AnchorButton>
              <AnchorButton variant="secondary" size="lg" href="/verify">Verify a certificate</AnchorButton>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <StatTile label="Verified" value={stats.verifiedKg.toLocaleString()} subtext="kg" variant="dark" />
            <StatTile label="Batches" value={stats.batchCount} subtext="verified" variant="light" />
            <StatTile label="Pickers paid" value={stats.pickersPaid} subtext="this quarter" variant="light" />
          </div>
        </section>

        <section id="how-it-works" style={{ marginTop: "56px" }}>
          <div className="eye" style={{ margin: "56px 0 16px", color: "var(--color-emerald)" }}>How it works</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "14px" }}>
            {[
              { step: "1", label: "Scan" },
              { step: "2", label: "Register" },
              { step: "3", label: "Transfer" },
              { step: "4", label: "Confirm" },
              { step: "5", label: "Recycle" },
              { step: "6", label: "Pay" },
              { step: "7", label: "Certify" },
            ].map(({ step, label }) => (
              <Card key={step} padding="md">
                <div className="lime" style={{ margin: 0, width: "36px", height: "36px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{step}</div>
                <div className="b8" style={{ marginTop: "12px" }}>{label}</div>
              </Card>
            ))}
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "48px" }}>
          <Card padding="lg">
            <div className="eye">Problem</div>
            <p style={{ margin: "8px 0 0", fontWeight: 600, color: "var(--color-muted)" }}>Recyclers can&apos;t prove where material came from, so credits get double counted.</p>
          </Card>
          <Card padding="lg">
            <div className="eye">Solution</div>
            <p style={{ margin: "8px 0 0", fontWeight: 600, color: "var(--color-muted)" }}>Every batch gets one traceable record from picker to certificate.</p>
          </Card>
          <Card padding="lg">
            <div className="eye">Impact</div>
            <p style={{ margin: "8px 0 0", fontWeight: 600, color: "var(--color-muted)" }}>Pickers are paid fairly and producers hold certificates nobody else can claim.</p>
          </Card>
        </section>
      </main>

      <footer style={{ padding: "28px 0", textAlign: "center" }}>
        <p className="hp">GitHub · IEEE Climate Chain hackathon</p>
      </footer>
    </div>
  );
}