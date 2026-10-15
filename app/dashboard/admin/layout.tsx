import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/guards";
import { getPendingApplicationsCount } from "@/lib/admin/dashboard-stats";
import { getPendingThankYouCount } from "@/lib/admin/thank-you";
import { getOpenConcernCount } from "@/lib/admin/concerns";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

async function getRoleLabel(userId: string | undefined) {
  if (!userId) return "Administrator";
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("trustee_role")
    .eq("id", userId)
    .single();
  return data?.trustee_role || "Administrator";
}

// Role/status are already enforced by proxy.ts for every /dashboard/admin/*
// route — this layout only reads the session for display, it doesn't gate.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, pendingApplications, pendingThankYous, openConcerns] = await Promise.all([
    getSession(),
    getPendingApplicationsCount(),
    getPendingThankYouCount(),
    getOpenConcernCount(),
  ]);
  const fullName = session?.profile.full_name ?? "Admin";
  const roleLabel = await getRoleLabel(session?.user.id);

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "268px" } as React.CSSProperties}
    >
      <AdminSidebar
        fullName={fullName}
        roleLabel={roleLabel}
        pendingApplications={pendingApplications}
        pendingThankYous={pendingThankYous}
        openConcerns={openConcerns}
      />
      <SidebarInset className="bg-[#f7faff]">
        <AdminHeader fullName={fullName} roleLabel={roleLabel} />
        <div className="flex-1 px-4 pb-12 sm:px-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
