import { redirect } from "next/navigation";

export default async function LegacyRetirePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/rec/batches/${id}/output`);
}
