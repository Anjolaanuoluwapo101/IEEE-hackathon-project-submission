import Link from "next/link";

export default function ProducerSponsorPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              Sponsor overview
            </h1>
            <p className="text-neutral-500 mt-1">
              Sponsor-related information and details for your producer account.
            </p>
          </div>
          <Link
            href="/prod/certificates"
            className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-xl bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            My certificates
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
          <h2 className="text-lg font-medium text-neutral-700">Sponsor details</h2>
          <p className="text-neutral-500 mb-4">
            Your producer account is sponsored by the IEEE CircuLagos program. This
            sponsorship provides access to the recycling verification and carbon
            credit marketplace.
          </p>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-neutral-500">Sponsor</dt>
              <dd className="font-medium text-neutral-900">IEEE CircuLagos</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Account status</dt>
              <dd className="font-medium text-neutral-900">Active</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}