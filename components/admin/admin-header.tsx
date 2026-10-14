"use client";

import { Bell, ChevronDown } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { initialsOf } from "@/components/admin/admin-sidebar";

export function AdminHeader({
  fullName,
  roleLabel,
}: {
  fullName: string;
  roleLabel: string;
}) {
  return (
    <div className="flex h-[72px] items-center justify-between gap-4 px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="size-11 rounded-[10px] border border-[#e5edf6] bg-white text-[#102a4d] lg:hidden" />
        <AdminBreadcrumb />
      </div>
      <div className="flex items-center gap-[18px]">
        <button
          type="button"
          aria-label="Notifications"
          className="grid size-11 place-items-center rounded-full text-[#102a4d] hover:bg-white"
        >
          <Bell className="size-5" />
        </button>
        <div className="hidden items-center gap-[11px] border-l border-[#e5edf6] pl-[18px] sm:flex">
          <span className="grid size-[38px] place-items-center rounded-full bg-[#e8eef6] font-extrabold text-[#183456]">
            {initialsOf(fullName)}
          </span>
          <span className="flex min-w-[110px] flex-col leading-tight">
            <b className="text-xs text-[#102a4d]">{fullName}</b>
            <span className="mt-0.5 text-[10px] text-[#7889a4]">{roleLabel}</span>
          </span>
          <ChevronDown className="size-4 text-[#7889a4]" />
        </div>
      </div>
    </div>
  );
}
