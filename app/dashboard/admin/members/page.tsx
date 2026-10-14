import { getMembers } from "@/lib/admin/members";
import { MembersTable } from "@/components/admin/members/members-table";
import { AnnouncementForm } from "@/components/admin/members/announcement-form";

export default async function MembersPage() {
  const members = await getMembers();

  return (
    <div className="flex flex-col gap-6 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-tace-navy">
            Members
          </h1>
          <p className="mt-1 text-sm text-tace-gray">
            Members and trustees, and foundation-wide announcements.
          </p>
        </div>
        <AnnouncementForm />
      </div>

      <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-5">
        <MembersTable members={members} />
      </div>
    </div>
  );
}
