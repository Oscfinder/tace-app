import { Building2, CalendarDays, UserCheck } from "lucide-react";
import {
  firstOfMonth,
  getCommitteeLead,
  getMemberProfile,
  getMyCommitteeUpdates,
  getNextCommitteeMeeting,
} from "@/lib/member/queries";
import { CommitteeUpdateForm } from "@/components/member/committee-update-form";
import {
  DarkBanner,
  DetailRow,
  EmptyState,
  IconTile,
  PageHeader,
  Panel,
  Pill,
  Stat,
  formatDate,
} from "@/components/member/ui";

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
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="My committee"
          title="Your team"
          subtitle="Your committee, lead and monthly updates."
        />
        <EmptyState
          icon={Building2}
          accent="teal"
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
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="My committee"
        title={committee}
        subtitle="Your team, next steps and monthly update."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat
          label="Committee lead"
          value={lead ?? "Not set"}
          foot="Your point of contact"
          icon={UserCheck}
          accent="purple"
        />
        <Stat
          label="Next meeting"
          value={
            nextMeeting?.event_date
              ? new Date(nextMeeting.event_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })
              : "None"
          }
          foot={nextMeeting?.title ?? "Nothing scheduled"}
          icon={CalendarDays}
          accent="blue"
        />
        <Stat
          label="This month's update"
          value={current ? "Sent" : "Due"}
          foot={monthLabel(thisMonth)}
          icon={Building2}
          accent={current ? "teal" : "amber"}
        />
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(290px,0.9fr)]">
        <Panel
          title="Monthly update"
          subtitle="One update per month — edit it any time before the month ends"
        >
          <CommitteeUpdateForm
            key={current?.id ?? "new"}
            monthLabel={monthLabel(thisMonth)}
            initialContent={current?.content ?? ""}
          />
        </Panel>

        <Panel title="Committee details" subtitle="Your team and next steps">
          <DarkBanner
            label="Your committee"
            title={committee}
            text="Helping build sustainable support for children."
          />
          <DetailRow label="Committee lead" value={lead ?? "Not assigned yet"} />
          <DetailRow
            label="Next meeting"
            value={
              nextMeeting ? formatDate(nextMeeting.event_date, true) : "None scheduled"
            }
          />
          <DetailRow label="Location" value={nextMeeting?.location ?? "—"} />
        </Panel>
      </div>

      <Panel title="Earlier updates" subtitle="Your past monthly updates">
        {earlier.length > 0 ? (
          <div>
            {earlier.map((u) => (
              <div
                key={u.id}
                className="flex gap-3 border-t border-[#eff3f7] py-4 first:border-t-0"
              >
                <IconTile icon={Building2} accent="amber" size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <strong className="text-[13px]">{monthLabel(u.update_month)}</strong>
                    <Pill accent="teal">Sent</Pill>
                  </div>
                  <p className="text-[13px] leading-[1.65] whitespace-pre-line text-[#6d8199]">
                    {u.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-m-muted">
            No earlier updates yet. Your past monthly updates will be listed
            here.
          </p>
        )}
      </Panel>
    </div>
  );
}
