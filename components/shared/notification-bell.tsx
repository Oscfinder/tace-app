"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/actions";

export type BellNotification = {
  id: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
};

export function NotificationBell({
  notifications,
  unread,
  allHref,
}: {
  notifications: BellNotification[];
  unread: number;
  allHref?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function markRead(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      router.refresh();
    });
  }

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        className="relative flex size-11 shrink-0 items-center justify-center rounded-[10px] border border-border bg-white text-tace-gray outline-none hover:text-tace-navy focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Bell className="size-[18px]" />
        {unread > 0 ? (
          <span className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-tace-red px-1 text-[11px] font-bold leading-5 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-[#F1F3F6] px-3 py-2.5">
          <span className="text-sm font-semibold text-tace-navy">
            Notifications
          </span>
          {unread > 0 ? (
            <button
              type="button"
              onClick={markAll}
              disabled={pending}
              className="min-h-11 px-2 text-xs font-medium text-tace-blue hover:underline disabled:opacity-50"
            >
              Mark all read
            </button>
          ) : null}
        </div>
        {notifications.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-tace-gray">
            You&apos;re all caught up.
          </p>
        ) : (
          <ul>
            {notifications.map((n) => (
              <li key={n.id} className="border-b border-[#F1F3F6] last:border-b-0">
                <button
                  type="button"
                  onClick={() => !n.is_read && markRead(n.id)}
                  className="flex min-h-11 w-full gap-2.5 px-3 py-2.5 text-left hover:bg-tace-lgray"
                >
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${
                      n.is_read ? "bg-transparent" : "bg-tace-blue"
                    }`}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-tace-navy">
                      {n.title}
                    </span>
                    {n.body ? (
                      <span className="mt-0.5 line-clamp-2 block text-xs text-tace-gray">
                        {n.body}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {allHref ? (
          <a
            href={allHref}
            className="flex min-h-11 items-center justify-center border-t border-[#F1F3F6] text-sm font-medium text-tace-blue hover:bg-tace-lgray"
          >
            View all
          </a>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
