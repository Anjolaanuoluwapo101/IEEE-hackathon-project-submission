import RecyclerBatchDetailClient from "./detail-client";

export default async function RecyclerBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RecyclerBatchDetailClient batchId={id} />;
}
