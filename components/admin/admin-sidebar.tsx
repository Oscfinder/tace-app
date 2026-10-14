"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FileText,
  Users,
  UserCheck,
  Heart,
  GraduationCap,
  DollarSign,
  Folder,
  BookOpen,
  LineChart,
  Settings,
  LogOut,
  ChevronRight,
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

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
  badge?: number;
};

export function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AdminSidebar({
  fullName,
  roleLabel,
  pendingApplications,
}: {
  fullName: string;
  roleLabel: string;
  pendingApplications: number;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [signOutOpen, setSignOutOpen] = useState(false);

  const NAV_ITEMS: NavItem[] = [
    { href: "/dashboard/admin", label: "Home", icon: Home, exact: true },
    {
      href: "/dashboard/admin/applications",
      label: "Applications",
      icon: FileText,
      badge: pendingApplications > 0 ? pendingApplications : undefined,
    },
    {
      href: "/dashboard/admin/beneficiaries",
      label: "Beneficiaries",
      icon: Users,
    },
    { href: "/dashboard/admin/members", label: "Members", icon: UserCheck },
    { href: "/dashboard/admin/sponsors", label: "Sponsors", icon: Heart },
    { href: "/dashboard/admin/mentors", label: "Mentors", icon: GraduationCap },
    {
      href: "/dashboard/admin/finance",
      label: "Finance & Donations",
      icon: DollarSign,
    },
    { href: "/dashboard/admin/projects", label: "Projects", icon: Folder },
    { href: "/dashboard/admin/content", label: "Content", icon: BookOpen },
    { href: "/dashboard/admin/reports", label: "Reports", icon: LineChart },
    { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      <Sidebar collapsible="offcanvas" className="border-r-0">
        <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#061e3c] to-[#062a53] px-[17px] py-[18px] text-white">
          {/* Soft decorative circles, bottom-left (from the design). */}
          <div
            className="pointer-events-none absolute -bottom-[100px] -left-[110px] size-[280px] rounded-full bg-[#159fea]/[0.08] shadow-[130px_-30px_0_rgba(21,159,234,0.04),190px_55px_0_rgba(21,159,234,0.035)]"
            aria-hidden
          />

          <SidebarHeader className="relative z-10 p-0">
            <Link
              href="/dashboard/admin"
              className="flex h-[83px] items-center gap-3 px-2"
            >
              <Image
                src="/images/tace-icon.png"
                alt=""
                width={192}
                height={192}
                priority
                className="size-12 shrink-0 object-contain drop-shadow-[0_3px_8px_#00a8e855]"
              />
              <span className="flex flex-col leading-tight">
                <span className="font-heading text-xl font-bold text-white">
                  TACE Foundation
                </span>
                <span className="mt-0.5 text-[11px] text-[#b9cae0]">
                  Guiding Children Toward Independence
                </span>
              </span>
            </Link>
          </SidebarHeader>

          <SidebarContent className="relative z-10 mt-[18px] gap-0 overflow-x-hidden p-0">
            <nav
              aria-label="Main navigation"
              className="flex flex-col gap-[5px]"
            >
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
                    className={`flex h-[46px] items-center gap-3.5 rounded-[11px] px-4 text-sm font-semibold transition ${
                      active
                        ? "bg-gradient-to-r from-[#14a7ef] to-[#1b9eea] text-white shadow-[0_7px_18px_rgba(9,154,232,0.22)]"
                        : "text-[#dce9f7] hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    <item.icon className="size-5 shrink-0" />
                    {item.label}
                    {item.badge ? (
                      <span className="ml-auto grid h-[22px] min-w-[22px] place-items-center rounded-full bg-[#0d72b7] px-1.5 text-[11px] font-bold text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </SidebarContent>

          <SidebarFooter className="relative z-10 mt-auto border-t border-white/[0.12] px-2.5 pt-[17px] pb-[3px]">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex min-h-11 w-full items-center gap-3 rounded-xl text-left outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#159fea]">
                <span className="grid size-[38px] shrink-0 place-items-center rounded-full bg-[#159fea] font-extrabold text-white">
                  {initialsOf(fullName)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <b className="truncate text-[13px]">{fullName}</b>
                  <span className="mt-0.5 truncate text-[11px] text-[#b9cae0]">
                    {roleLabel}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-white/85" />
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
