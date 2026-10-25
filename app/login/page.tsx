import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/session";
import LoginClient from "./login-client";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (session) redirect(ROLE_HOME[session.role]);

  const params = await searchParams;
  const rawNext = params.next;
  const nextPath =
    typeof rawNext === "string" &&
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//") &&
    !rawNext.includes("\\")
      ? rawNext
      : null;

  return <LoginClient nextPath={nextPath} />;
}
