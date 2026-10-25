import NewCertificateClient from "./new-client";

export default async function NewCertificatePage({
  searchParams,
}: {
  searchParams: Promise<{ batchIds?: string }>;
}) {
  const params = await searchParams;
  const batchIds =
    typeof params.batchIds === "string"
      ? params.batchIds.split(",").map((id) => id.trim()).filter(Boolean)
      : [];

  return <NewCertificateClient initialBatchIds={batchIds} />;
}
