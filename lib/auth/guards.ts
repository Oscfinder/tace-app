import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/roles";

export type SessionProfile = {
  role: Role;
  status: string;
  full_name: string;
};

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, full_name")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return { user, profile: profile as SessionProfile };
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireActive() {
  const session = await requireAuth();
  if (session.profile.status === "pending") redirect("/pending");
  return session;
}

export async function requireRole(role: Role) {
  const session = await requireActive();
  if (session.profile.role !== role)
    redirect(getDashboardPath(session.profile.role));
  // Admins must also have passed two-factor sign-in. proxy.ts checks this for
  // admin pages, but a Server Action can be POSTed to any URL, so every admin
  // page and action checks it again here.
  if (role === "admin" && !(await hasSecondFactor())) redirect("/admin-2fa");
  return session;
}

// True once this session has been upgraded with a verified authenticator code
// (Supabase "aal2"). Read from the signed session token, no network call.
export async function hasSecondFactor() {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return data?.currentLevel === "aal2";
}

export function getDashboardPath(role: Role) {
  return `/dashboard/${role}`;
}
