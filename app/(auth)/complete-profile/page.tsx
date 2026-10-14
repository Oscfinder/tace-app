import { redirect } from "next/navigation";
import { AuthCard } from "@/components/forms/auth-card";
import { CompleteProfileForm } from "@/components/forms/complete-profile-form";
import { createClient } from "@/lib/supabase/server";
import { getDashboardPath } from "@/lib/auth/guards";
import { SELF_SERVE_ROLES } from "@/lib/validations/auth";
import type { Role } from "@/types/roles";

export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, status, profile_completed")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  // Already done — an existing user goes straight to where they belong.
  if (profile.profile_completed) {
    redirect(
      profile.status === "pending"
        ? "/pending"
        : getDashboardPath(profile.role as Role),
    );
  }

  const { role } = await searchParams;
  const initialRole = (SELF_SERVE_ROLES as readonly string[]).includes(role ?? "")
    ? (role as (typeof SELF_SERVE_ROLES)[number])
    : "member";

  return (
    <AuthCard
      title="Complete Your Profile"
      description="Just a few more details so we can set up your account. An admin will review it before you get access."
    >
      <CompleteProfileForm
        initialRole={initialRole}
        initialName={profile.full_name}
      />
    </AuthCard>
  );
}
