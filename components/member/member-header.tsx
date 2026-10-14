"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  NotificationBell,
  type BellNotification,
} from "@/components/shared/notification-bell";
import { initialsOf } from "@/components/member/member-sidebar";

const LABELS: Record<string, string> = {
  updates: "Foundation Updates",
  impact: "Impact Feed",
  committee: "My Committee",
  events: "Events & Meetings",
  campaigns: "Campaigns",
  resources: "Resources",
  profile: "My Profile",
};

export function MemberHeader({
  fullName,
  roleLabel,
  avatarUrl,
  notifications,
  unread,
}: {
  fullName: string;
  roleLabel: string;
  avatarUrl: string | null;
  notifications: BellNotification[];
  unread: number;
}) {
  const pathname = usePathname();
  const section = pathname.split("/")[3];
  const current = section ? (LABELS[section] ?? "Home") : "Home";

  return (
    <header className="mx-4 mb-6 flex h-[68px] items-center justify-between gap-3 border-b border-[#e6edf5] sm:mx-6 sm:mb-[30px] sm:h-20 lg:mx-[34px]">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="size-11 rounded-[11px] border border-m-line bg-white text-m-ink lg:hidden" />
        <nav aria-label="Breadcrumb" className="hidden text-xs text-m-muted sm:block">
          <Link href="/dashboard/member" className="hover:text-m-ink">
            Member Area
          </Link>
          &nbsp; / &nbsp;
          <b className="text-[#173454]">{current}</b>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell notifications={notifications} unread={unread} />
        <Link
          href="/dashboard/member/profile"
          className="flex items-center gap-[9px] rounded-xl pl-1"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="size-9 rounded-xl object-cover"
            />
          ) : (
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#e1f5ff] font-bold text-[#087fc2]">
              {initialsOf(fullName)}
            </span>
          )}
          <span className="hidden flex-col leading-tight sm:flex">
            <strong className="text-xs">{fullName}</strong>
            <span className="mt-[3px] text-[11px] text-m-muted">{roleLabel}</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
