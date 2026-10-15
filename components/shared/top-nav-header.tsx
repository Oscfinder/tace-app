"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gift,
  GraduationCap,
  HandHeart,
  Heart,
  Home,
  Inbox,
  LogOut,
  MessageSquareHeart,
  MessagesSquare,
  TrendingUp,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  NotificationBell,
  type BellNotification,
} from "@/components/shared/notification-bell";
import { SignOutDialog } from "@/components/shared/sign-out-dialog";

// Icons are components (functions), and a Server Component can't pass those to
// a Client Component. Layouts pass a plain string key instead and the icon is
// looked up here, on the client side of the boundary.
const ICONS = {
  home: Home,
  heart: Heart,
  progress: TrendingUp,
  support: HandHeart,
  gift: Gift,
  thanks: MessageSquareHeart,
  profile: UserCircle,
  mentor: GraduationCap,
  mentees: Users,
  messages: MessagesSquare,
  requests: Inbox,
} satisfies Record<string, LucideIcon>;
export type NavIcon = keyof typeof ICONS;

export type NavTab = {
  href: string;
  label: string;
  icon: NavIcon;
  exact?: boolean;
};

// Simple top navigation for the sponsor and mentor dashboards: logo, bell,
// sign-out and a horizontally scrollable section menu that works on small
// phones. (Same look as the beneficiary header.)
export function TopNavHeader({
  homeHref,
  tabs,
  notifications,
  unread,
  notificationsHref,
}: {
  homeHref: string;
  tabs: NavTab[];
  notifications: BellNotification[];
  unread: number;
  notificationsHref?: string;
}) {
  const pathname = usePathname();
  const [signOutOpen, setSignOutOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-m-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 pt-3 sm:px-6">
        <Link href={homeHref} className="flex items-center gap-2.5">
          <Image
            src="/images/tace-icon.png"
            alt=""
            width={96}
            height={96}
            priority
            className="size-10 shrink-0 object-contain"
          />
          <span className="m-head text-base font-extrabold tracking-[-0.3px] text-m-ink">
            TACE Foundation
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell
            notifications={notifications}
            unread={unread}
            allHref={notificationsHref}
          />
          <button
            type="button"
            onClick={() => setSignOutOpen(true)}
            aria-label="Sign out"
            className="grid size-11 place-items-center rounded-xl border border-m-line bg-white text-[#506985] hover:text-[#ec4f7b]"
          >
            <LogOut className="size-[18px]" />
          </button>
        </div>
      </div>

      <nav
        aria-label="Sections"
        className="mx-auto mt-2 flex max-w-4xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => {
          const Icon = ICONS[tab.icon];
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-[15px] font-semibold whitespace-nowrap transition ${
                active
                  ? "bg-gradient-to-r from-m-blue to-[#19b2ed] text-white shadow-[0_8px_18px_#009de832]"
                  : "bg-[#eef6fd] text-[#35597d] hover:bg-[#e1f0fb]"
              }`}
            >
              <Icon className="size-[18px]" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <SignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
    </header>
  );
}
