"use client";

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
  ChevronDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/actions";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
  badge?: number;
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AdminSidebar({
  fullName,
  pendingApplications,
}: {
  fullName: string;
  pendingApplications: number;
}) {
  const pathname = usePathname();

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
    <Sidebar collapsible="offcanvas" className="border-r-0">
      <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#061e3c] to-[#062a53]">
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 size-64 rounded-full bg-tace-blue/[0.08]"
          aria-hidden
        />
        <SidebarHeader className="relative z-10 px-3 py-5">
          <Link
            href="/dashboard/admin"
            className="flex items-center gap-2.5 px-2"
          >
            <Image
              src="/images/tace-icon.png"
              alt=""
              width={192}
              height={192}
              priority
              className="size-10 shrink-0 object-contain"
            />
            <span className="flex flex-col leading-tight">
              <span className="font-heading text-lg font-bold text-white">
                TACE Foundation
              </span>
              <span className="text-xs text-white/40">
                Guiding Children Toward Independence
              </span>
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="relative z-10 px-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        render={<Link href={item.href} />}
                        className={
                          active
                            ? "bg-tace-blue text-white hover:bg-tace-blue hover:text-white"
                            : "text-white/60 hover:bg-white/5 hover:text-white/80"
                        }
                      >
                        <item.icon className="size-[18px]" />
                        {item.label}
                      </SidebarMenuButton>
                      {item.badge ? (
                        <SidebarMenuBadge className="bg-tace-red text-[11px] font-bold text-white">
                          {item.badge}
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="relative z-10 border-t border-white/10 px-3 py-3.5">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1 outline-none hover:bg-white/5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tace-blue text-[13px] font-semibold text-white">
                {initialsOf(fullName)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
                <span className="truncate text-[13px] font-medium text-white">
                  {fullName}
                </span>
                <span className="text-[11px] text-white/40">Administrator</span>
              </span>
              <ChevronDown className="size-4 shrink-0 text-white/40" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56">
              <DropdownMenuItem
                closeOnClick={false}
                render={
                  <form action={signOut} className="contents">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-1.5 text-left"
                    >
                      <LogOut className="size-4" />
                      Sign Out
                    </button>
                  </form>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
