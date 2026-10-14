"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  NotificationBell,
  type BellNotification,
} from "@/components/shared/notification-bell";

export function MemberHeader({
  notifications,
  unread,
}: {
  notifications: BellNotification[];
  unread: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 pt-4 sm:px-6 sm:pt-6">
      <SidebarTrigger className="size-11 lg:hidden" />
      <div className="ml-auto">
        <NotificationBell notifications={notifications} unread={unread} />
      </div>
    </div>
  );
}
