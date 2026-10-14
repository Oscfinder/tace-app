import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDashboardPath } from "@/lib/auth/guards";
import type { Role } from "@/types/roles";

// Hit by the links in Supabase's "Confirm signup" and "Reset password"
// email templates: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=...
// Those templates must be updated in the Supabase dashboard to point here —
// by default they link to {{ .ConfirmationURL }}, which lands on
// "/#access_token=...&type=..." with nothing on this site to read a URL
// fragment (fragments never reach the server at all).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // Same-site relative paths only — anything else would be an open redirect.
  const rawNext = searchParams.get("next");
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : null;

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL("/login?error=invalid_link", origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error) {
    return NextResponse.redirect(new URL("/login?error=invalid_link", origin));
  }

  if (type === "recovery") {
    return NextResponse.redirect(new URL(next ?? "/reset-password", origin));
  }

  // Signup confirmation (and any other type) — verifyOtp already
  // established a session, so route straight to where that session
  // belongs instead of forcing another sign-in.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (profile) {
      if (profile.status === "pending") {
        return NextResponse.redirect(new URL("/pending", origin));
      }
      return NextResponse.redirect(
        new URL(getDashboardPath(profile.role as Role), origin),
      );
    }
  }

  return NextResponse.redirect(new URL(next ?? "/login", origin));
}
