import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/guards";
import { TwoFactorForm } from "@/components/forms/two-factor-form";
import { isAdminMfaRequired } from "@/lib/security/mfa";

// Where an admin sets up or confirms their authenticator app. When
// ADMIN_MFA_REQUIRED=true they must finish this before any /dashboard/admin page
// or admin action will work (see proxy.ts and requireRole); when it is off, it
// is optional and reachable from Admin > Settings. Only a signed-in admin can
// see it.
export default async function AdminTwoFactorPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.profile.role !== "admin") redirect(`/dashboard/${session.profile.role}`);
  return <TwoFactorForm required={isAdminMfaRequired()} />;
}
