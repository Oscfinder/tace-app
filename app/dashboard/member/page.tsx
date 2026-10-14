import Link from "next/link";
import {
  Users,
  Building2,
  CalendarDays,
  Megaphone,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import {
  firstOfMonth,
  getBeneficiaryCount,
  getCommitteeLead,
  getLatestAnnouncement,
  getMemberProfile,
  getMyCommitteeUpdates,
  getMyRsvps,
  getNextCommitteeMeeting,
  getRecentActivity,
  getUpcomingEvents,
} from "@/lib/member/queries";
import {
  DarkBanner,
  DetailRow,
  IconTile,
  Panel,
  Pill,
  ProgressRing,
  Stat,
  DateBadge,
  formatDate,
  type Accent,
} from "@/components/member/ui";

function timeAgo(timestamp: string) {
  const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : formatDate(timestamp);
}

const ACTIVITY_STYLE: Record<
  "announcement" | "story" | "update",
  { icon: typeof Megaphone; accent: Accent }
> = {
  announcement: { icon: Megaphone, accent: "blue" },
  story: { icon: Sparkles, accent: "teal" },
  update: { icon: CheckCircle2, accent: "amber" },
};

const EVENT_ACCENTS: Accent[] = ["blue", "teal", "purple", "amber"];

export default async function MemberHomePage() {
  const profile = await getMemberProfile();
  if (!profile) return null;
  const committee = profile.committee;

  const [childCount, announcement, events, lead, nextMeeting, activity, updates, rsvps] =
    await Promise.all([
      getBeneficiaryCount(),
      getLatestAnnouncement(),
      getUpcomingEvents(),
      committee ? getCommitteeLead() : Promise.resolve(null),
      committee ? getNextCommitteeMeeting(committee) : Promise.resolve(null),
      getRecentActivity(profile.id),
      getMyCommitteeUpdates(profile.id),
      getMyRsvps(profile.id),
    ]);

  const firstName = profile.full_name.split(" ")[0];
  const meetings = events.filter((e) => e.event_type === "meeting");

  // "Your month" checklist behind the progress ring: only counts things that
  // apply to this member.
  const checklist: { label: string; done: boolean; href: string }[] = [];
  if (committee) {
    checklist.push({
      label: "Send this month's committee update",
      done: updates.some((u) => u.update_month === firstOfMonth()),
      href: "/dashboard/member/committee",
    });
  }
  if (events.length > 0) {
    checklist.push({
      label: "Respond to upcoming events",
      done: events.every((e) => rsvps.has(e.id)),
      href: "/dashboard/member/events",
    });
  }
  checklist.push({
    label: "Complete your profile",
    done: Boolean(profile.phone && profile.avatar_url),
    href: "/dashboard/member/profile",
  });
  const doneCount = checklist.filter((c) => c.done).length;
  const percent = Math.round((doneCount / checklist.length) * 100);

  return (
    <div className="flex flex-col">
      <section className="mb-6 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-[9px] text-[11px] font-bold tracking-[1.3px] text-[#0798d9] uppercase">
            Member dashboard
          </p>
          <h1 className="mb-2 text-[25px] font-extrabold tracking-[-1.1px] text-m-ink sm:text-[29px]">
            Welcome back, {firstName} <span className="text-2xl">👋</span>
          </h1>
          <p className="text-sm leading-relaxed text-m-muted">
            Here&apos;s what&apos;s happening at TACE Foundation today.
          </p>
        </div>
        <Link
          href="/dashboard/member/committee"
          className="inline-flex min-h-11 items-center rounded-xl bg-m-navy px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_#092b4d18] hover:bg-m-navy2"
        >
          Your activity <span className="ml-2.5 text-[#6dd2ff]">↗</span>
        </Link>
      </section>

      <section
        aria-label="Member statistics"
        className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4"
      >
        <Stat
          label="Children in our programme"
          value={childCount}
          foot="● Active programme"
          icon={Users}
          accent="blue"
          href="/dashboard/member/campaigns"
        />
        <Stat
          label="Committee membership"
          value={committee ? committee.split(/[\s&]+/)[0] : "None yet"}
          foot={committee ?? "An admin will assign you soon"}
          icon={Building2}
          accent="teal"
          href="/dashboard/member/committee"
        />
        <div className="col-span-2 lg:col-span-1">
          <Stat
            label="Upcoming meetings"
            value={meetings.length}
            foot={
              meetings[0]
                ? `Next: ${new Date(meetings[0].event_date!).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                : "Nothing scheduled"
            }
            icon={CalendarDays}
            accent="purple"
            href="/dashboard/member/events"
          />
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(290px,0.9fr)]">
        <div className="grid min-w-0 gap-5">
          <Panel
            title="Latest announcement"
            subtitle="Important news from the foundation"
            href="/dashboard/member/updates"
          >
            {announcement ? (
              <div className="flex items-start gap-3.5 rounded-[14px] border border-[#e2f0fb] bg-gradient-to-br from-[#f2faff] to-[#f8fbff] p-[19px]">
                <IconTile icon={Megaphone} accent="blue" />
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-[9px]">
                    <strong className="text-sm">{announcement.title}</strong>
                    <Pill accent="teal">Latest</Pill>
                  </div>
                  <p className="mb-2 text-[11px] text-[#8b9bb0]">
                    {formatDate(announcement.published_at)}
                  </p>
                  <p className="mb-3 line-clamp-3 text-xs leading-[1.65] whitespace-pre-line text-[#6d8199]">
                    {announcement.content}
                  </p>
                  <Link
                    href="/dashboard/member/updates"
                    className="inline-flex min-h-11 items-center text-xs font-bold text-[#008fda] hover:underline"
                  >
                    Read announcement →
                  </Link>
                </div>
              </div>
            ) : (
              <p className="rounded-[14px] bg-[#f2faff] px-4 py-6 text-center text-sm text-m-muted">
                No announcements yet. News from the foundation will show up
                here first.
              </p>
            )}

            <div className="mt-4 flex items-center justify-between gap-3 rounded-[13px] border border-[#edf1f6] bg-[#fbfcfe] px-4 py-3.5">
              <div className="min-w-0">
                <strong className="mb-1 block text-xs">Your month at TACE</strong>
                <span className="text-[11px] text-m-muted">
                  {doneCount} of {checklist.length} done
                </span>
                <ul className="mt-2 space-y-0.5">
                  {checklist.map((c) => (
                    <li key={c.label}>
                      <Link
                        href={c.href}
                        className="inline-flex min-h-8 items-center gap-1.5 text-[11px] hover:underline"
                        style={{ color: c.done ? "#0caf91" : "#6c819b" }}
                      >
                        <span aria-hidden>{c.done ? "✓" : "○"}</span>
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <ProgressRing percent={percent} />
            </div>
          </Panel>

          <Panel
            title="Recent activity"
            subtitle="A quick look at what's happening"
            href="/dashboard/member/impact"
            linkLabel="See stories"
          >
            {activity.length > 0 ? (
              <div>
                {activity.map((a) => {
                  const { icon, accent } = ACTIVITY_STYLE[a.kind];
                  return (
                    <div
                      key={a.id}
                      className="flex items-start gap-3 border-t border-[#eff3f7] py-[13px] first:border-t-0"
                    >
                      <IconTile icon={icon} accent={accent} size="sm" />
                      <div className="min-w-0 flex-1">
                        <strong className="mt-px mb-1 block text-xs">{a.title}</strong>
                        <p className="truncate text-[11px] text-m-muted">{a.text}</p>
                      </div>
                      <time className="hidden pt-0.5 text-[10px] whitespace-nowrap text-[#9aa9ba] sm:block">
                        {timeAgo(a.at)}
                      </time>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-m-muted">
                Nothing yet. New announcements, stories and your own updates
                will appear here.
              </p>
            )}
          </Panel>
        </div>

        <div className="grid min-w-0 gap-5">
          <Panel
            title="My committee"
            subtitle="Your team and next steps"
            href="/dashboard/member/committee"
            linkLabel="Details"
          >
            {committee ? (
              <>
                <DarkBanner
                  label="Your committee"
                  title={committee}
                  text="Helping build sustainable support for children."
                />
                <DetailRow label="Committee lead" value={lead ?? "Not assigned yet"} />
                <DetailRow
                  label="Next meeting"
                  value={nextMeeting ? formatDate(nextMeeting.event_date, true) : "None scheduled"}
                />
                <DetailRow label="Location" value={nextMeeting?.location ?? "—"} />
              </>
            ) : (
              <p className="py-6 text-center text-sm text-m-muted">
                You haven&apos;t been placed on a committee yet. An admin will
                assign you soon.
              </p>
            )}
          </Panel>

          <Panel
            title="Upcoming events"
            subtitle="Save the date"
            href="/dashboard/member/events"
          >
            {events.length > 0 ? (
              <div>
                {events.slice(0, 3).map((e, i) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-[13px] border-t border-[#eff3f7] py-3.5 first:border-t-0"
                  >
                    <DateBadge iso={e.event_date} accent={EVENT_ACCENTS[i % EVENT_ACCENTS.length]} />
                    <div className="min-w-0 flex-1">
                      <strong className="mb-[5px] block truncate text-xs">{e.title}</strong>
                      <span className="block truncate text-[11px] text-m-muted">
                        {[e.location, e.event_date ? new Date(e.event_date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                    {e.event_type ? (
                      <span className="hidden sm:block">
                        <Pill accent={EVENT_ACCENTS[(i + 1) % EVENT_ACCENTS.length]}>
                          <span className="capitalize">{e.event_type}</span>
                        </Pill>
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-m-muted">
                No upcoming events right now. Check back soon.
              </p>
            )}
          </Panel>

          <section className="relative overflow-hidden rounded-[18px] bg-gradient-to-br from-[#087dbd] to-[#05a9e6] p-[21px] text-white shadow-[0_12px_25px_#068dd51c]">
            <span
              className="pointer-events-none absolute -top-[22px] right-[18px] text-[130px] leading-none text-white/10"
              aria-hidden
            >
              ✦
            </span>
            <p className="mb-[9px] text-[11px] font-bold tracking-[1.3px] text-[#bdeaff] uppercase">
              Make a difference
            </p>
            <h3 className="mb-[9px] max-w-[250px] text-[19px] leading-[1.3] font-extrabold">
              Every contribution builds a brighter future.
            </h3>
            <p className="mb-4 max-w-[290px] text-xs leading-[1.6] text-[#d9f3ff]">
              Share your skills, support a campaign or help connect TACE with
              people who care.
            </p>
            <Link
              href="/dashboard/member/campaigns"
              className="inline-flex min-h-11 items-center rounded-[10px] bg-white px-3.5 py-3 text-xs font-extrabold text-[#087cb8] hover:bg-[#f2faff]"
            >
              Explore ways to help <span className="pl-2.5">→</span>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
