import Link from "next/link";
import {
  getBeneficiaryCount,
  getCommitteeLead,
  getLatestAnnouncement,
  getMemberProfile,
  getNextCommitteeMeeting,
  getUpcomingEvents,
} from "@/lib/member/queries";
import { Card, EmptyState, PageHeader, formatDate } from "@/components/member/ui";

export default async function MemberHomePage() {
  const profile = await getMemberProfile();
  const committee = profile?.committee ?? null;

  const [childCount, announcement, events, lead, nextMeeting] =
    await Promise.all([
      getBeneficiaryCount(),
      getLatestAnnouncement(),
      getUpcomingEvents(3),
      committee ? getCommitteeLead() : Promise.resolve(null),
      committee ? getNextCommitteeMeeting(committee) : Promise.resolve(null),
    ]);

  const firstName = profile?.full_name.split(" ")[0] ?? "there";

  return (
    <div className="flex flex-col gap-6 pt-5">
      <PageHeader
        title={`Welcome, ${firstName}`}
        subtitle="Here's what's happening at the foundation."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-tace-gray">Children in our programme</p>
          <p className="mt-1 font-heading text-3xl font-bold text-tace-navy">
            {childCount}
          </p>
          <p className="mt-1 text-xs text-tace-gray">
            Children whose families agreed to appear publicly.
          </p>
        </Card>

        <Card>
          <h2 className="font-heading text-base font-semibold text-tace-navy">
            My Committee
          </h2>
          {committee ? (
            <dl className="mt-2 space-y-1 text-sm">
              <div>
                <dt className="inline text-tace-gray">Committee: </dt>
                <dd className="inline font-medium text-tace-navy">{committee}</dd>
              </div>
              <div>
                <dt className="inline text-tace-gray">Lead: </dt>
                <dd className="inline font-medium text-tace-navy">
                  {lead ?? "Not assigned yet"}
                </dd>
              </div>
              <div>
                <dt className="inline text-tace-gray">Next meeting: </dt>
                <dd className="inline font-medium text-tace-navy">
                  {nextMeeting
                    ? formatDate(nextMeeting.event_date, true)
                    : "None scheduled"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-sm text-tace-gray">
              You haven&apos;t been placed on a committee yet. An admin will
              assign you soon.
            </p>
          )}
        </Card>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold text-tace-navy">
          Latest announcement
        </h2>
        {announcement ? (
          <Card>
            <p className="font-semibold text-tace-navy">{announcement.title}</p>
            <p className="mt-0.5 text-xs text-tace-gray">
              {formatDate(announcement.published_at)}
            </p>
            <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm text-tace-gray">
              {announcement.content}
            </p>
            <Link
              href="/dashboard/member/updates"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-tace-blue hover:underline"
            >
              All updates
            </Link>
          </Card>
        ) : (
          <EmptyState
            title="No announcements yet"
            message="When the foundation posts news, you'll see it here first."
          />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold text-tace-navy">
          Upcoming events
        </h2>
        {events.length > 0 ? (
          <div className="flex flex-col gap-3">
            {events.map((e) => (
              <Card key={e.id}>
                <p className="font-semibold text-tace-navy">{e.title}</p>
                <p className="mt-0.5 text-sm text-tace-gray">
                  {formatDate(e.event_date, true)}
                  {e.location ? ` · ${e.location}` : ""}
                </p>
              </Card>
            ))}
            <Link
              href="/dashboard/member/events"
              className="inline-flex min-h-11 items-center text-sm font-medium text-tace-blue hover:underline"
            >
              See all events and RSVP
            </Link>
          </div>
        ) : (
          <EmptyState
            title="Nothing scheduled"
            message="No upcoming events or meetings right now. Check back soon."
          />
        )}
      </section>
    </div>
  );
}
