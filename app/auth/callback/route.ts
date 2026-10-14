import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDashboardPath } from "@/lib/auth/guards";
import { SELF_SERVE_ROLES } from "@/lib/validations/auth";
import type { Role } from "@/types/roles";

// OAuth (Google) return URL: /auth/callback?code=...&intent=<role>
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const intent = searchParams.get("intent");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=invalid_link", origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", origin));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, profile_completed")
    .eq("id", user.id)
    .single();
  if (!profile) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", origin));
  }

  // New Google user: collect the role-specific fields our forms would have.
  if (!profile.profile_completed) {
    const url = new URL("/complete-profile", origin);
    if (intent && (SELF_SERVE_ROLES as readonly string[]).includes(intent)) {
      url.searchParams.set("role", intent);
    }
    return NextResponse.redirect(url);
  }

  if (profile.status === "inactive" || profile.status === "suspended") {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL(`/login?error=account_${profile.status}`, origin),
    );
  }
  if (profile.status === "pending") {
    return NextResponse.redirect(new URL("/pending", origin));
  }
  return NextResponse.redirect(
    new URL(getDashboardPath(profile.role as Role), origin),
  );
}
