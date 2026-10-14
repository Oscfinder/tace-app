import { getMemberProfile, getNotificationSummary } from "@/lib/member/queries";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MemberSidebar } from "@/components/member/member-sidebar";
import { MemberHeader } from "@/components/member/member-header";

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

  const roleLabel =
    profile?.member_type === "trustee"
      ? (profile.trustee_role ?? "Trustee")
      : "Member";

  return (
    <SidebarProvider>
      <MemberSidebar
        fullName={profile?.full_name ?? "Member"}
        roleLabel={roleLabel}
      />
      <SidebarInset className="bg-tace-lgray">
        <MemberHeader
          notifications={notifications.latest}
          unread={notifications.unread}
        />
        <div className="flex-1 px-4 pb-12 sm:px-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
