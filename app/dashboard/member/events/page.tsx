import {
  getMemberProfile,
  getMyRsvps,
  getPastMeetings,
  getUpcomingEvents,
} from "@/lib/member/queries";
import { RsvpButtons } from "@/components/member/rsvp-buttons";
import { Card, EmptyState, PageHeader, formatDate } from "@/components/member/ui";

export default async function EventsPage() {
  const profile = await getMemberProfile();
  const [upcoming, past, rsvps] = await Promise.all([
    getUpcomingEvents(),
    getPastMeetings(),
    profile ? getMyRsvps(profile.id) : Promise.resolve(new Map()),
  ]);

  return (
    <div className="flex flex-col gap-8 pt-5">
      <PageHeader
        title="Events & Meetings"
        subtitle="Let us know if you can make it."
      />

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold text-tace-navy">
          Upcoming
        </h2>
        {upcoming.length > 0 ? (
          upcoming.map((e) => (
            <Card key={e.id} className="flex flex-col gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-tace-navy">{e.title}</h3>
                  {e.event_type ? (
                    <span className="rounded-full bg-tace-lgray px-2 py-0.5 text-[11px] font-bold capitalize text-tace-gray">
                      {e.event_type}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-sm text-tace-gray">
                  {formatDate(e.event_date, true)}
                  {e.location ? ` · ${e.location}` : ""}
                </p>
                {e.description ? (
                  <p className="mt-2 whitespace-pre-line text-sm text-tace-gray">
                    {e.description}
                  </p>
                ) : null}
              </div>
              <RsvpButtons eventId={e.id} initial={rsvps.get(e.id) ?? null} />
            </Card>
          ))
        ) : (
          <EmptyState
            title="Nothing scheduled"
            message="No upcoming events or meetings. New ones will appear here."
          />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold text-tace-navy">
          Past meetings
        </h2>
        {past.length > 0 ? (
          past.map((m) => (
            <Card key={m.id}>
              <h3 className="font-semibold text-tace-navy">{m.title}</h3>
              <p className="mt-0.5 text-xs text-tace-gray">
                {formatDate(m.event_date, true)}
              </p>
              {m.minutes ? (
                <div className="mt-3 rounded-lg bg-tace-lgray p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-tace-gray">
                    Minutes
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-tace-navy">
                    {m.minutes}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-tace-gray">
                  Minutes haven&apos;t been posted yet.
                </p>
              )}
            </Card>
          ))
        ) : (
          <EmptyState
            title="No past meetings"
            message="Once meetings have taken place, their minutes will be kept here."
          />
        )}
      </section>
    </div>
  );
}
