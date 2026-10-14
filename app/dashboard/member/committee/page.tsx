import {
  firstOfMonth,
  getCommitteeLead,
  getMemberProfile,
  getMyCommitteeUpdates,
  getNextCommitteeMeeting,
} from "@/lib/member/queries";
import { CommitteeUpdateForm } from "@/components/member/committee-update-form";
import { Card, EmptyState, PageHeader, formatDate } from "@/components/member/ui";

function monthLabel(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function CommitteePage() {
  const profile = await getMemberProfile();
  const committee = profile?.committee ?? null;

  if (!profile || !committee) {
    return (
      <div className="flex flex-col gap-6 pt-5">
        <PageHeader title="My Committee" />
        <EmptyState
          title="No committee yet"
          message="You haven't been placed on a committee. An admin will assign you soon, and your committee details will show up here."
        />
      </div>
    );
  }

  const [lead, nextMeeting, updates] = await Promise.all([
    getCommitteeLead(),
    getNextCommitteeMeeting(committee),
    getMyCommitteeUpdates(profile.id),
  ]);

  const thisMonth = firstOfMonth();
  const current = updates.find((u) => u.update_month === thisMonth);
  const earlier = updates.filter((u) => u.update_month !== thisMonth);

  return (
    <div className="flex flex-col gap-6 pt-5">
      <PageHeader title="My Committee" subtitle={committee} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-tace-gray">Committee lead</p>
          <p className="mt-1 font-semibold text-tace-navy">
            {lead ?? "Not assigned yet"}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-tace-gray">Next committee meeting</p>
          <p className="mt-1 font-semibold text-tace-navy">
            {nextMeeting
              ? `${nextMeeting.title} — ${formatDate(nextMeeting.event_date, true)}`
              : "None scheduled"}
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="font-heading text-base font-semibold text-tace-navy">
          Monthly update
        </h2>
        <p className="mb-3 mt-1 text-sm text-tace-gray">
          One update per month. You can edit it any time before the month ends.
        </p>
        <CommitteeUpdateForm
          key={current?.id ?? "new"}
          monthLabel={monthLabel(thisMonth)}
          initialContent={current?.content ?? ""}
        />
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold text-tace-navy">
          Earlier updates
        </h2>
        {earlier.length > 0 ? (
          earlier.map((u) => (
            <Card key={u.id}>
              <p className="text-sm font-semibold text-tace-navy">
                {monthLabel(u.update_month)}
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-tace-gray">
                {u.content}
              </p>
            </Card>
          ))
        ) : (
          <EmptyState
            title="No earlier updates"
            message="Your past monthly updates will be listed here."
          />
        )}
      </section>
    </div>
  );
}
