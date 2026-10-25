import BatchOutputClient from "./output-client";

export default async function BatchOutputPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BatchOutputClient batchId={id} />;
}
