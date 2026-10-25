export async function signOut() {
  await fetch("/api/auth/logout", { method: "POST" });
}