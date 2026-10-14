import { getAdminEventGroups } from "@/lib/admin/events";
import { EventsManager } from "@/components/admin/content/events-manager";

export default async function AdminEventsPage() {
  const { upcoming, past } = await getAdminEventGroups();

  return (
    <div className="flex flex-col gap-6 pt-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-tace-navy">Events</h1>
        <p className="mt-1 text-sm text-tace-gray">
          Meetings, events, trainings and outreach. Members see them on their dashboard and can RSVP.
        </p>
      </div>
      <EventsManager upcoming={upcoming} past={past} />
    </div>
  );
}
