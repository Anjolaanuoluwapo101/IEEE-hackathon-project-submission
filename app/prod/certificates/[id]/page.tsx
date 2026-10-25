import { CertificateView } from "@/components/CertificateView";

export default async function ProducerCertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <CertificateView
          certificateId={id}
          backHref="/prod/certificates"
          backLabel="My certificates"
        />
      </div>
    </div>
  );
}
