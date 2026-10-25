import { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AnchorButton, Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Profile - CircuLagos",
  description: "Your profile and payment account",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) return null;

  return (
    <div className="f" style={{ display: "flex", minHeight: "820px", background: "var(--color-bg-primary)" }}>
      <aside data-cl-sidebar data-role="picker" data-active="3" />
      <main style={{ flex: 1, minWidth: 0, padding: "36px 48px" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flexEnd" }}>
          <div>
            <div className="eye" style={{ color: "var(--color-emerald)" }}>Picker</div>
            <h1 className="d" style={{ fontSize: "48px", margin: "6px 0 6px" }}>Profile</h1>
            <p style={{ margin: 0, fontSize: "16px", color: "var(--color-muted)" }}>Your details and payment account.</p>
          </div>
        </div>

        <div style={{ marginTop: "28px" }}>
          <div style={{ maxWidth: "640px" }}>
            <Card className="row" style={{ padding: "22px", gap: "16px" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(140deg,#17B873,#075236)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "22px" }}>
                {session.name.charAt(0).toUpperCase()}{session.name.split(" ")[1]?.charAt(0)?.toUpperCase() || ""}
              </div>
              <div>
                <div className="d" style={{ fontSize: "28px" }}>{session.name}</div>
                <div style={{ color: "var(--color-muted)", fontWeight: 600 }}>{session.area}, Lagos</div>
              </div>
            </Card>

            <Card style={{ padding: "22px", marginTop: "16px" }}>
              <div className="eye">Payment account</div>
              <div className="row mono" style={{ marginTop: "10px", gap: "8px" }}>{session.walletAddress}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-12a2 2 0 0 0-2-2h-2" /><rect x="8" y="11" width="8" height="4" rx="1" /></svg></div>
              <p className="hp">Read only. Your payouts are sent here.</p>
            </Card>

<div style={{ marginTop: "20px" }}>
  <Button variant="secondary" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}>Sign out</Button>
</div>
          </div>
        </div>
      </main>
    </div>
  );
}