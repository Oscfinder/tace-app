import { DM_Sans, Manrope } from "next/font/google";
import {
  getAvatarUrl,
  getMemberProfile,
  getNotificationSummary,
} from "@/lib/member/queries";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MemberSidebar } from "@/components/member/member-sidebar";
import { MemberHeader } from "@/components/member/member-header";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Role/status are enforced by proxy.ts for every /dashboard/member/* route
// (wrong-role, pending, inactive and suspended users are redirected there);
// this layout only reads data for display.
export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, notifications] = await Promise.all([
    getMemberProfile(),
    getNotificationSummary(),
  ]);
  const avatarUrl = await getAvatarUrl(profile?.avatar_url ?? null);

  const roleLabel =
    profile?.member_type === "trustee"
      ? (profile.trustee_role ?? "Trustee")
      : "Foundation Member";

  return (
    <div className={`member-theme ${manrope.variable} ${dmSans.variable}`}>
      <SidebarProvider
        style={{ "--sidebar-width": "264px" } as React.CSSProperties}
      >
        <MemberSidebar
          fullName={profile?.full_name ?? "Member"}
          subtitle={profile?.committee ?? roleLabel}
          avatarUrl={avatarUrl}
        />
        <SidebarInset className="bg-m-bg">
          <MemberHeader
            fullName={profile?.full_name ?? "Member"}
            roleLabel={roleLabel}
            avatarUrl={avatarUrl}
            notifications={notifications.latest}
            unread={notifications.unread}
          />
          <div className="flex-1 px-4 pb-10 sm:px-6 lg:px-[34px]">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
