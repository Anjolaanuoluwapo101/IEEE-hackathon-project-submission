import { Metadata } from "next";
import { getImpactStats } from "@/lib/analytics";
import { AnchorButton, Button } from "@/components/ui/Button";
import { Card, DarkPanel, StatTile } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

export const metadata: Metadata = {
  title: "Impact Dashboard - CircuLagos",
  description: "Real-time recycling impact metrics",
};

export default async function DashboardPage() {
  const stats = await getImpactStats();

  const weeklyData = stats.weeklyKg.slice(-6).map((w, i) => ({
    week: `W${i + 1}`,
    kg: w.kg,
    height: Math.max(20, (w.kg / Math.max(...stats.weeklyKg.map(w => w.kg), 1)) * 140),
  }));

  const maxMaterialKg = Math.max(...Object.values(stats.byMaterial), 1);
  const maxAreaKg = Math.max(...Object.values(stats.byArea), 1);

  return (
    <div className="f" style={{ minHeight: "1100px", background: "var(--color-bg-primary)" }}>
      <header className="row" style={{ justifyContent: "space-between", padding: "18px 48px", background: "var(--color-card)", borderBottom: "1px solid var(--color-line)" }}>
        <div className="row" style={{ fontWeight: 800, fontSize: "19px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "linear-gradient(140deg,#17B873,#075236)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 16px -8px #0A7A4E" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10zM2 21c0-3 1.9-5.5 6-7" />
            </svg>
            <span>CircuLagos</span>
          </div>
        </div>
        <Badge variant="available">Signed in as Producer</Badge>
      </header>

      <main style={{ padding: "36px 48px" }}>
        <div className="eye" style={{ color: "var(--color-emerald)" }}>Impact</div>
        <h1 className="d" style={{ fontSize: "48px", margin: "6px 0 24px" }}>Impact dashboard</h1>

        <section style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: "16px" }}>
          <StatTile label="Verified material" value={stats.verifiedKg.toLocaleString()} subtext="across {stats.batchCount} batches" variant="dark" />
          <StatTile label="Batches" value={stats.batchCount} subtext="retired and verified" variant="light" />
          <StatTile label="Pickers paid" value={stats.pickersPaid} subtext="this quarter" variant="light" />
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
          <Card padding="lg">
            <div className="eye">Verified kg by week</div>
            <div className="row" style={{ alignItems: "flexEnd", gap: "12px", height: "170px", marginTop: "16px" }}>
              {weeklyData.map((w) => (
                <div key={w.week} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ height: `${w.height}px`, background: "linear-gradient(180deg,var(--color-emerald-bright),var(--color-emerald))", borderRadius: "10px 10px 4px 4px" }} />
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-muted)", marginTop: "6px" }}>{w.week}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="lg">
            <div className="eye">By material</div>
            {Object.entries(stats.byMaterial)
              .sort((a, b) => b[1] - a[1])
              .map(([material, kg]) => (
                <div key={material} style={{ marginTop: "16px" }}>
                  <div className="row" style={{ justifyContent: "space-between", fontWeight: 700 }}>
                    <span>{material}</span>
                    <b>{kg.toLocaleString()} kg</b>
                  </div>
                  <ProgressBar value={kg} max={Math.max(...Object.values(stats.byMaterial), 1)} style={{ marginTop: "8px" }} />
                </div>
              ))}
          </Card>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginTop: "16px" }}>
          <Card padding="lg">
            <div className="eye">By area</div>
            {Object.entries(stats.byArea)
              .sort((a, b) => b[1] - a[1])
              .map(([area, kg]) => (
                <div key={area} style={{ marginTop: "16px" }}>
                  <div className="row" style={{ justifyContent: "space-between", fontWeight: 700 }}>
                    <span>{area}</span>
                    <b>{kg.toLocaleString()} kg</b>
                  </div>
                  <ProgressBar value={kg} max={maxAreaKg} style={{ marginTop: "8px" }} />
                </div>
              ))}
          </Card>

          <Card padding="lg" style={{ gridColumn: "span 2" }}>
            <div className="eye">Weak spots</div>
            {stats.weakSpots.map((spot, i) => (
              <div key={i} className="row ln" style={{ justifyContent: "space-between", padding: "14px 0", marginTop: i === 0 ? "8px" : 0 }}>
                <div>
                  <div className="b8">{spot.area}</div>
                  <div style={{ fontSize: "13px", color: "var(--color-muted)", fontWeight: 600 }}>{spot.kg.toLocaleString()} kg verified</div>
                </div>
                <Badge variant="pending">Low collection</Badge>
              </div>
            ))}
          </Card>
        </section>
      </main>
    </div>
  );
}