import { CalendarDays, FileText } from "lucide-react";
import {
  getMemberProfile,
  getMyRsvps,
  getPastMeetings,
  getUpcomingEvents,
} from "@/lib/member/queries";
import { RsvpButtons } from "@/components/member/rsvp-buttons";
import {
  Card,
  DateBadge,
  EmptyState,
  IconTile,
  PageHeader,
  Panel,
  Pill,
  formatDate,
  type Accent,
} from "@/components/member/ui";

const CYCLE: Accent[] = ["blue", "teal", "purple", "amber"];

export default async function EventsPage() {
  const profile = await getMemberProfile();
  const [upcoming, past, rsvps] = await Promise.all([
    getUpcomingEvents(),
    getPastMeetings(),
    profile ? getMyRsvps(profile.id) : Promise.resolve(new Map()),
  ]);

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Events & meetings"
        title="Save the date"
        subtitle="Let us know if you can make it."
      />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-extrabold tracking-[-0.3px]">Upcoming</h2>
        {upcoming.length > 0 ? (
          upcoming.map((e, i) => (
            <Card key={e.id} className="flex flex-col gap-4">
              <div className="flex gap-3.5">
                <DateBadge iso={e.event_date} accent={CYCLE[i % CYCLE.length]} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-extrabold">{e.title}</h3>
                    {e.event_type ? (
                      <Pill accent={CYCLE[(i + 1) % CYCLE.length]}>
                        <span className="capitalize">{e.event_type}</span>
                      </Pill>
                    ) : null}
                    {rsvps.get(e.id) === "attending" ? (
                      <Pill accent="teal">You&apos;re going</Pill>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-m-muted">
                    {formatDate(e.event_date, true)}
                    {e.location ? ` · ${e.location}` : ""}
                  </p>
                  {e.description ? (
                    <p className="mt-2 text-[13px] leading-[1.65] whitespace-pre-line text-[#6d8199]">
                      {e.description}
                    </p>
                  ) : null}
                </div>
              </div>
              <RsvpButtons eventId={e.id} initial={rsvps.get(e.id) ?? null} />
            </Card>
          ))
        ) : (
          <EmptyState
            icon={CalendarDays}
            accent="purple"
            title="Nothing scheduled"
            message="No upcoming events or meetings. New ones will appear here."
          />
        )}
      </section>

      <Panel title="Past meetings" subtitle="Minutes from previous meetings">
        {past.length > 0 ? (
          <div>
            {past.map((m) => (
              <div
                key={m.id}
                className="flex gap-3 border-t border-[#eff3f7] py-4 first:border-t-0"
              >
                <IconTile icon={FileText} accent="teal" size="sm" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-[13px] font-extrabold">{m.title}</h3>
                  <p className="text-[11px] text-m-muted">
                    {formatDate(m.event_date, true)}
                  </p>
                  {m.minutes ? (
                    <div className="mt-2.5 rounded-xl bg-[#e4fbf4] p-3.5">
                      <p className="text-[10px] font-bold tracking-[1px] text-[#0caf91] uppercase">
                        Minutes
                      </p>
                      <p className="mt-1 text-[13px] leading-[1.65] whitespace-pre-line text-m-ink">
                        {m.minutes}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-xs text-m-muted">
                      Minutes haven&apos;t been posted yet.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-m-muted">
            No past meetings yet. Once meetings take place, their minutes will
            be kept here.
          </p>
        )}
      </Panel>
    </div>
  );
}
