import { getApplications } from "@/lib/admin/applications";
import { ApplicationsTable } from "@/components/admin/applications/applications-table";

export default async function ApplicationsPage() {
  const applications = await getApplications();

  return (
    <div className="flex flex-col gap-6 pt-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-tace-navy">
          Applications
        </h1>
        <p className="mt-1 text-sm text-tace-gray">
          Review beneficiary applications submitted through the public site.
        </p>
      </div>

      <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-5">
        <ApplicationsTable applications={applications} />
      </div>
    </div>
  );
}
