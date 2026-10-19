import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/guards";
import { TwoFactorForm } from "@/components/forms/two-factor-form";

// Admins must finish this step before any /dashboard/admin page or admin
// action will work (see proxy.ts and requireRole). Only a signed-in, active
// admin can see it.
export default async function AdminTwoFactorPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.profile.role !== "admin") redirect(`/dashboard/${session.profile.role}`);
  return <TwoFactorForm />;
}
