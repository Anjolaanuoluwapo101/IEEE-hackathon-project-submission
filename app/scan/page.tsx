import { redirect } from "next/navigation";
import { getRoleSession } from "@/lib/auth";
import ScanClient from "./scan-client";

export default async function ScanPage() {
  const session = await getRoleSession(["picker"]);
  if (!session) redirect("/");

  return (
    <ScanClient
      picker={{
        id: session.id,
        name: session.name,
        area: session.area,
        org: session.org,
      }}
    />
  );
}
