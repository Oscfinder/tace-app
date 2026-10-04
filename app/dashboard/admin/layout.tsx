import { getSession } from "@/lib/auth/guards";
import { getPendingApplicationsCount } from "@/lib/admin/dashboard-stats";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

// Role/status are already enforced by proxy.ts for every /dashboard/admin/*
// route — this layout only reads the session for display, it doesn't gate.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, pendingApplications] = await Promise.all([
    getSession(),
    getPendingApplicationsCount(),
  ]);
  const fullName = session?.profile.full_name ?? "Admin";

  return (
    <SidebarProvider>
      <AdminSidebar
        fullName={fullName}
        pendingApplications={pendingApplications}
      />
      <SidebarInset className="bg-tace-lgray">
        <AdminHeader />
        <div className="flex-1 px-6 pb-12">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
