import {
  getSponsors,
  getAllBeneficiaries,
  getProjectOptions,
  getActiveSponsorOptions,
} from "@/lib/admin/sponsors";
import { SponsorsTable } from "@/components/admin/sponsors/sponsors-table";
import { DonationLogger } from "@/components/admin/sponsors/donation-logger";

export default async function SponsorsPage() {
  const [sponsors, beneficiaries, projects, sponsorOptions] = await Promise.all(
    [
      getSponsors(),
      getAllBeneficiaries(),
      getProjectOptions(),
      getActiveSponsorOptions(),
    ],
  );

  return (
    <div className="flex flex-col gap-6 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-tace-navy">
            Sponsors
          </h1>
          <p className="mt-1 text-sm text-tace-gray">
            Long-term sponsor accounts and manually logged donations.
          </p>
        </div>
        <DonationLogger
          sponsors={sponsorOptions}
          beneficiaries={beneficiaries}
          projects={projects}
        />
      </div>

      <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-5">
        <SponsorsTable sponsors={sponsors} />
      </div>
    </div>
  );
}
