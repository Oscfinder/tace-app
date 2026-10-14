"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  admin: "Home",
  member: "Home",
  updates: "Foundation Updates",
  impact: "Impact Feed",
  committee: "My Committee",
  events: "Events & Meetings",
  campaigns: "Campaigns",
  resources: "Resources",
  profile: "My Profile",
  applications: "Applications",
  beneficiaries: "Beneficiaries",
  members: "Members",
  sponsors: "Sponsors",
  mentors: "Mentors",
  finance: "Finance & Donations",
  projects: "Projects",
  content: "Content",
  reports: "Reports",
  settings: "Settings",
  new: "New",
  stories: "Stories",
  announcements: "Announcements",
};

function labelFor(segment: string) {
  return (
    LABELS[segment] ??
    segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function AdminBreadcrumb() {
  const pathname = usePathname();
  // Drop the leading "dashboard" segment — everything after it is relative
  // to /dashboard/admin.
  const segments = pathname.split("/").filter(Boolean).slice(1);

  return (
    <div className="flex items-center gap-1.5 text-[13px] text-tace-gray">
      {segments.map((segment, i) => {
        const href = "/dashboard/" + segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        return (
          <span key={href} className="flex items-center gap-1.5">
            {i > 0 ? <span>/</span> : null}
            {isLast ? (
              <span>{labelFor(segment)}</span>
            ) : (
              <Link href={href} className="hover:text-tace-navy">
                {labelFor(segment)}
              </Link>
            )}
          </span>
        );
      })}
    </div>
  );
}
