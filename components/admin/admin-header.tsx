"use client";

import { Bell } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";

export function AdminHeader() {
  return (
    <div className="flex items-center justify-between gap-4 px-6 pt-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="lg:hidden" />
        <AdminBreadcrumb />
      </div>
      <button
        type="button"
        aria-label="Notifications"
        className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-border bg-white text-tace-gray hover:text-tace-navy"
      >
        <Bell className="size-[18px]" />
      </button>
    </div>
  );
}
