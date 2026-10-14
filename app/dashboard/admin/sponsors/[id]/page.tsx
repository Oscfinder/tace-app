import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getSponsor,
  getDonations,
  getUnsponsoredBeneficiaries,
  getAllBeneficiaries,
  getProjectOptions,
} from "@/lib/admin/sponsors";
import { MemberStatusBadge } from "@/components/admin/members/member-badges";
import { SponsorActivationPanel } from "@/components/admin/sponsors/sponsor-activation-panel";
import { DonationLogger } from "@/components/admin/sponsors/donation-logger";
import { DonationHistory } from "@/components/admin/sponsors/donation-history";

export default async function SponsorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sponsor = await getSponsor(id);
  if (!sponsor) notFound();

  const [donations, unsponsoredBeneficiaries, allBeneficiaries, projects] =
    await Promise.all([
      getDonations(id),
      sponsor.status === "pending"
        ? getUnsponsoredBeneficiaries()
        : Promise.resolve([]),
      getAllBeneficiaries(),
      getProjectOptions(),
    ]);

  return (
    <div className="flex flex-col gap-5 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold text-tace-navy">
              {sponsor.full_name}
            </h1>
            <MemberStatusBadge status={sponsor.status} />
          </div>
          <p className="mt-1 text-sm text-tace-gray">
            {sponsor.email}
            {sponsor.phone ? ` · ${sponsor.phone}` : ""}
          </p>
        </div>
        <DonationLogger
          sponsors={[
            {
              id: sponsor.id,
              full_name: sponsor.full_name,
              linkedBeneficiaryId: sponsor.linkedBeneficiaryId,
              linkedBeneficiaryName: sponsor.linkedBeneficiaryName,
              linkedBeneficiaryCount: sponsor.linkedBeneficiaryCount,
            },
          ]}
          beneficiaries={allBeneficiaries}
          projects={projects}
          lockedSponsorId={sponsor.id}
          lockedSponsorName={sponsor.full_name}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-6">
          <h2 className="font-heading text-base font-semibold text-tace-navy">
            Donation History
          </h2>
          <div className="mt-4">
            <DonationHistory donations={donations} />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-5">
            <h3 className="font-heading text-sm font-semibold text-tace-navy">
              Linked Beneficiary
            </h3>
            {sponsor.linkedBeneficiaryName && sponsor.linkedBeneficiaryId ? (
              <Link
                href={`/dashboard/admin/beneficiaries/${sponsor.linkedBeneficiaryId}`}
                className="mt-2 block text-sm font-medium text-tace-blue hover:underline"
              >
                {sponsor.linkedBeneficiaryName}
              </Link>
            ) : (
              <p className="mt-2 text-sm text-tace-gray/70">None yet</p>
            )}
          </div>

          {sponsor.status === "pending" ? (
            <SponsorActivationPanel
              sponsorId={sponsor.id}
              profileId={sponsor.profile_id ?? ""}
              beneficiaries={unsponsoredBeneficiaries}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
