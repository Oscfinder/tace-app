import { getAnnouncements } from "@/lib/admin/content";
import { AnnouncementsManager } from "@/components/admin/content/announcements-manager";

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements();

  return (
    <div className="flex flex-col gap-6 pt-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-tace-navy">
          Announcements
        </h1>
        <p className="mt-1 text-sm text-tace-gray">
          Shown on the member dashboard once published.
        </p>
      </div>

      <AnnouncementsManager announcements={announcements} />
    </div>
  );
}
