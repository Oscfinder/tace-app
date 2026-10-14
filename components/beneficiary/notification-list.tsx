"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/actions";

type Item = {
  id: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
};

export function NotificationList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const unread = items.filter((i) => !i.is_read).length;

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
    <div className="flex flex-col gap-3">
      {unread > 0 ? (
        <button
          type="button"
          onClick={markAll}
          disabled={pending}
          className="flex min-h-12 items-center justify-center gap-2 self-start rounded-xl border border-m-line bg-white px-5 text-base font-bold text-[#008fda] shadow-m-card disabled:opacity-50"
        >
          <CheckCheck className="size-5" />
          Mark all as read
        </button>
      ) : null}

      <ul className="flex flex-col gap-3">
        {items.map((n) => (
          <li
            key={n.id}
            className={`rounded-[18px] border p-4 shadow-m-card ${
              n.is_read
                ? "border-m-line bg-white"
                : "border-[#bfe6fb] bg-gradient-to-br from-[#f2faff] to-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-2 size-3 shrink-0 rounded-full ${
                  n.is_read ? "bg-[#d5dfea]" : "bg-m-blue"
                }`}
                aria-label={n.is_read ? "Read" : "New"}
              />
              <div className="min-w-0 flex-1">
                <h2 className="m-head text-[17px] font-extrabold text-m-ink">
                  {n.title}
                </h2>
                {n.body ? (
                  <p className="mt-1 text-[16px] leading-relaxed text-[#4d6584]">
                    {n.body}
                  </p>
                ) : null}
                <p className="mt-1.5 text-sm text-m-muted">
                  {new Date(n.created_at).toLocaleString("en-NG", {
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            {!n.is_read ? (
              <button
                type="button"
                onClick={() => markRead(n.id)}
                disabled={pending}
                className="mt-3 min-h-11 rounded-xl bg-[#e5f6ff] px-4 text-base font-bold text-[#008fda] disabled:opacity-50"
              >
                Mark as read
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
