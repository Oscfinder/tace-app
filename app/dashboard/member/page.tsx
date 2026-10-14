import Link from "next/link";
import {
  Users,
  CalendarDays,
  HeartHandshake,
  Megaphone,
  Sparkles,
  Building2,
  FolderOpen,
  UserCircle,
  ArrowRight,
} from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { QuickActionCard } from "@/components/admin/quick-action-card";
import { WelcomeBanner } from "@/components/admin/welcome-banner";
import { UpcomingEventsPanel } from "@/components/admin/upcoming-events-panel";
import { getUpcomingEvents as getNextEvents } from "@/lib/admin/upcoming-events";
import {
  getBeneficiaryCount,
  getCommitteeLead,
  getLatestAnnouncement,
  getMemberCounts,
  getMemberProfile,
  getNextCommitteeMeeting,
} from "@/lib/member/queries";
import { formatDate } from "@/components/member/ui";

export default async function MemberHomePage() {
  const profile = await getMemberProfile();
  const committee = profile?.committee ?? null;

  const [childCount, counts, announcement, events, lead, nextMeeting] =
    await Promise.all([
      getBeneficiaryCount(),
      getMemberCounts(),
      getLatestAnnouncement(),
      getNextEvents(3),
      committee ? getCommitteeLead() : Promise.resolve(null),
      committee ? getNextCommitteeMeeting(committee) : Promise.resolve(null),
    ]);

  const firstName = profile?.full_name.split(" ")[0] ?? "there";

  return (
    <div className="flex flex-col gap-6 pt-5">
      <WelcomeBanner firstName={firstName} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Users}
          label="Children in Our Programme"
          value={childCount}
          accent="blue"
          href="/dashboard/member/campaigns"
        />
        <StatCard
          icon={CalendarDays}
          label="Upcoming Events"
          value={counts.upcomingEvents}
          accent="yellow"
          href="/dashboard/member/events"
        />
        <StatCard
          icon={HeartHandshake}
          label="Active Campaigns"
          value={counts.activeCampaigns}
          accent="red"
          href="/dashboard/member/campaigns"
        />
        <StatCard
          icon={Megaphone}
          label="Announcements"
          value={counts.announcements}
          accent="green"
          href="/dashboard/member/updates"
        />
        <StatCard
          icon={Sparkles}
          label="Impact Stories"
          value={counts.stories}
          accent="slate"
          href="/dashboard/member/impact"
        />
        <StatCard
          icon={Building2}
          label="My Committee"
          value={committee ?? "Not yet assigned"}
          accent="blue"
          href="/dashboard/member/committee"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1.1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-[22px]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-semibold text-tace-navy">
                Latest Announcement
              </h2>
              <Link
                href="/dashboard/member/updates"
                className="inline-flex min-h-11 items-center gap-1 text-[13px] font-medium text-tace-blue hover:underline"
              >
                View all <ArrowRight className="size-3.5" />
              </Link>
            </div>
            {announcement ? (
              <div className="mt-2 flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#FEF6E2] text-tace-yellow">
                  <Megaphone className="size-[17px]" />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-tace-navy">
                    {announcement.title}
                  </p>
                  <p className="text-xs text-tace-gray/70">
                    {formatDate(announcement.published_at)}
                  </p>
                  <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm text-tace-gray">
                    {announcement.content}
                  </p>
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-[13.5px] text-tace-gray/70">
                No announcements yet. When the foundation posts news,
                you&apos;ll see it here first.
              </p>
            )}
          </div>

          <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-[22px]">
            <h2 className="font-heading text-base font-semibold text-tace-navy">
              My Committee
            </h2>
            {committee ? (
              <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-[#E8F6FD] p-3.5">
                  <dt className="text-xs text-tace-gray">Committee</dt>
                  <dd className="mt-0.5 text-sm font-bold text-tace-navy">
                    {committee}
                  </dd>
                </div>
                <div className="rounded-xl bg-[#F4F1FF] p-3.5">
                  <dt className="text-xs text-tace-gray">Lead</dt>
                  <dd className="mt-0.5 text-sm font-bold text-tace-navy">
                    {lead ?? "Not assigned yet"}
                  </dd>
                </div>
                <div className="rounded-xl bg-[#EAF8EF] p-3.5">
                  <dt className="text-xs text-tace-gray">Next meeting</dt>
                  <dd className="mt-0.5 text-sm font-bold text-tace-navy">
                    {nextMeeting
                      ? formatDate(nextMeeting.event_date, true)
                      : "None scheduled"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="py-6 text-center text-[13.5px] text-tace-gray/70">
                You haven&apos;t been placed on a committee yet. An admin will
                assign you soon.
              </p>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-[18px]">
            <h2 className="font-heading text-base font-semibold text-tace-navy">
              Quick Actions
            </h2>
            <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <QuickActionCard
                icon={Building2}
                label="Monthly Update"
                subtitle="Report for your committee"
                href="/dashboard/member/committee"
                accent="blue"
              />
              <QuickActionCard
                icon={CalendarDays}
                label="RSVP to Events"
                subtitle="Attend or decline"
                href="/dashboard/member/events"
                accent="green"
              />
              <QuickActionCard
                icon={FolderOpen}
                label="Resources"
                subtitle="Foundation documents"
                href="/dashboard/member/resources"
                accent="purple"
              />
              <QuickActionCard
                icon={UserCircle}
                label="My Profile"
                subtitle="Update your details"
                href="/dashboard/member/profile"
                accent="pink"
              />
            </div>
          </div>

          <UpcomingEventsPanel events={events} />
        </div>
      </div>
    </div>
  );
}
