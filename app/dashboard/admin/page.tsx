import {
  Users,
  Heart,
  FileCheck,
  DollarSign,
  GraduationCap,
  UserCheck,
  FileText,
  UserPlus,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { QuickActionCard } from "@/components/admin/quick-action-card";
import { WelcomeBanner } from "@/components/admin/welcome-banner";
import { ImpactChart } from "@/components/admin/impact-chart";
import { UpcomingEventsPanel } from "@/components/admin/upcoming-events-panel";
import { getSession } from "@/lib/auth/guards";
import {
  getAdminDashboardStats,
  getBeneficiaryGrowth,
} from "@/lib/admin/dashboard-stats";
import { getUpcomingEvents } from "@/lib/admin/upcoming-events";
import {
  getRecentActivity,
  type ActivityEventType,
} from "@/lib/admin/recent-activity";

const ACTIVITY_ICONS: Record<
  ActivityEventType,
  { icon: LucideIcon; className: string }
> = {
  application: { icon: FileText, className: "bg-[#E8F6FD] text-tace-blue" },
  registration: { icon: UserPlus, className: "bg-[#F1EFFB] text-tace-gray" },
  donation: { icon: DollarSign, className: "bg-[#EAF8EF] text-tace-green" },
  message: { icon: Megaphone, className: "bg-[#FEF6E2] text-tace-yellow" },
};

function timeAgo(timestamp: string) {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function AdminHomePage() {
  const [session, stats, activity, growth, upcomingEvents] = await Promise.all([
    getSession(),
    getAdminDashboardStats(),
    getRecentActivity(),
    getBeneficiaryGrowth(),
    getUpcomingEvents(),
  ]);

  const firstName = (session?.profile.full_name ?? "Admin").split(" ")[0];

  return (
    <div className="flex flex-col gap-6 pt-5">
      <WelcomeBanner firstName={firstName} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total Beneficiaries"
          value={stats.totalBeneficiaries}
          accent="blue"
          href="/dashboard/admin/beneficiaries"
        />
        <StatCard
          icon={Heart}
          label="Active Sponsors"
          value={stats.activeSponsors}
          accent="red"
          href="/dashboard/admin/sponsors"
        />
        <StatCard
          icon={FileCheck}
          label="Pending Applications"
          value={stats.pendingApplications}
          accent="yellow"
          href="/dashboard/admin/applications"
        />
        <StatCard
          icon={DollarSign}
          label="Total Donated"
          value={`₦${stats.totalDonations.toLocaleString()}`}
          accent="green"
          href="/dashboard/admin/finance"
        />
        <StatCard
          icon={GraduationCap}
          label="Active Mentors"
          value={stats.activeMentors}
          accent="blue"
          href="/dashboard/admin/mentors"
        />
        <StatCard
          icon={UserCheck}
          label="Active Members"
          value={stats.activeMembers}
          accent="slate"
          href="/dashboard/admin/members"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1.1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-[22px]">
            <h2 className="font-heading text-base font-semibold text-tace-navy">
              Impact Overview
            </h2>
            <p className="mt-0.5 text-xs text-tace-gray/70">
              New beneficiaries added, last 6 months
            </p>
            <div className="mt-3">
              <ImpactChart data={growth} />
            </div>
          </div>

          <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-[22px]">
            <h2 className="mb-4 font-heading text-base font-semibold text-tace-navy">
              Recent Activity
            </h2>

            {activity.length > 0 ? (
              <div className="flex flex-col">
                {activity.map((event) => {
                  const { icon: Icon, className } = ACTIVITY_ICONS[event.type];
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 border-b border-[#F1F3F6] py-3 last:border-b-0"
                    >
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${className}`}
                      >
                        <Icon className="size-[15px]" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-medium text-tace-navy">
                          {event.label}
                        </div>
                        <div className="text-xs text-tace-gray/70">
                          {timeAgo(event.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-[13.5px] text-tace-gray/70">
                  No activity yet. New applications, registrations and donations
                  will show up here.
                </p>
              </div>
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
                icon={FileText}
                label="Review Applications"
                subtitle="Check new applications"
                href="/dashboard/admin/applications"
                accent="blue"
              />
              <QuickActionCard
                icon={DollarSign}
                label="Record Donation"
                subtitle="Log a new donation"
                href="/dashboard/admin/finance"
                accent="pink"
              />
              <QuickActionCard
                icon={UserPlus}
                label="Add Member"
                subtitle="Invite a new member"
                href="/dashboard/admin/members"
                accent="purple"
              />
              <QuickActionCard
                icon={Megaphone}
                label="Post Content"
                subtitle="Share an update"
                href="/dashboard/admin/content"
                accent="green"
              />
            </div>
          </div>

          <UpcomingEventsPanel events={upcomingEvents} />
        </div>
      </div>
    </div>
  );
}
