"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Megaphone,
  Sparkles,
  Users,
  CalendarDays,
  HeartHandshake,
  FolderOpen,
  UserCircle,
  LogOut,
  ChevronDown,
  Lightbulb,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutDialog } from "@/components/shared/sign-out-dialog";

const NAV_ITEMS = [
  { href: "/dashboard/member", label: "Home", icon: Home, exact: true },
  { href: "/dashboard/member/updates", label: "Foundation Updates", icon: Megaphone },
  { href: "/dashboard/member/impact", label: "Impact Feed", icon: Sparkles },
  { href: "/dashboard/member/committee", label: "My Committee", icon: Users },
  { href: "/dashboard/member/events", label: "Events & Meetings", icon: CalendarDays },
  { href: "/dashboard/member/campaigns", label: "Campaigns", icon: HeartHandshake },
  { href: "/dashboard/member/resources", label: "Resources", icon: FolderOpen },
  { href: "/dashboard/member/profile", label: "My Profile", icon: UserCircle },
];

export function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function MemberSidebar({
  fullName,
  subtitle,
  avatarUrl,
}: {
  fullName: string;
  subtitle: string;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [signOutOpen, setSignOutOpen] = useState(false);

  return (
    <>
      <Sidebar collapsible="offcanvas" className="border-r-0">
        <div className="flex h-full flex-col overflow-hidden bg-gradient-to-br from-[#061b35] via-[#08294d] to-[#07345c] px-4 pt-[26px] pb-[18px] text-white">
          <SidebarHeader className="p-0">
            <Link
              href="/dashboard/member"
              className="flex items-center gap-3 px-2.5 pb-[31px]"
            >
              <Image
                src="/images/tace-icon.png"
                alt=""
                width={192}
                height={192}
                priority
                className="size-11 shrink-0 object-contain drop-shadow-[0_3px_8px_#00a8e855]"
              />
              <span className="flex flex-col leading-tight">
                <span className="m-head text-lg font-extrabold tracking-[-0.5px]">
                  TACE Foundation
                </span>
                <span className="mt-[3px] text-xs text-[#8ca7c5]">
                  Member Area
                </span>
              </span>
            </Link>
          </SidebarHeader>

          <SidebarContent className="gap-0 overflow-x-hidden p-0">
            <p className="mx-[13px] mt-2 mb-3 text-[10px] font-bold tracking-[1.5px] text-[#6684a5] uppercase">
              Workspace
            </p>
            <nav aria-label="Main navigation" className="grid gap-[5px]">
              {NAV_ITEMS.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpenMobile(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-[13px] rounded-xl px-[13px] py-3 text-sm font-medium transition ${
                      active
                        ? "bg-gradient-to-r from-m-blue to-[#19b2ed] text-white shadow-[0_8px_18px_#009de832]"
                        : "text-[#a9bdd3] hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <item.icon className="size-[18px] shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="min-h-7 flex-1" />

            <div className="mx-[3px] mt-6 mb-4 rounded-[15px] border border-white/10 bg-white/[0.03] p-4">
              <span className="mb-[11px] flex size-[31px] items-center justify-center rounded-[10px] bg-[#10a6e826] text-[#55c7ff]">
                <Lightbulb className="size-4" />
              </span>
              <strong className="mb-[5px] block text-[13px]">
                Your contribution matters
              </strong>
              <p className="mb-3 text-[11px] leading-[1.6] text-[#9cb3cb]">
                Every hour, skill and connection helps a child move closer to
                independence.
              </p>
              <Link
                href="/dashboard/member/campaigns"
                onClick={() => setOpenMobile(false)}
                className="inline-flex min-h-11 items-center text-xs font-bold text-[#5bc9ff] hover:underline"
              >
                Explore ways to help ↗
              </Link>
            </div>
          </SidebarContent>

          <SidebarFooter className="border-t border-white/10 px-1.5 pt-[19px] pb-0">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex min-h-11 w-full items-center gap-2.5 rounded-xl outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-m-blue2">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    className="size-[39px] shrink-0 rounded-[13px] object-cover"
                  />
                ) : (
                  <span className="flex size-[39px] shrink-0 items-center justify-center rounded-[13px] bg-gradient-to-br from-[#10b5e9] to-[#087cc5] font-bold text-white">
                    {initialsOf(fullName)}
                  </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
                  <strong className="truncate text-xs">{fullName}</strong>
                  <span className="mt-[3px] truncate text-[11px] text-[#8ca7c5]">
                    {subtitle}
                  </span>
                </span>
                <ChevronDown className="size-[18px] shrink-0 text-[#8ca7c5]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-56">
                <DropdownMenuItem
                  onClick={() => setSignOutOpen(true)}
                  className="min-h-11 cursor-pointer"
                >
                  <LogOut className="size-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </div>
      </Sidebar>
      <SignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
    </>
  );
}
