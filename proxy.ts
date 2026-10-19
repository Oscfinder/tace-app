import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getDashboardPath } from "@/lib/auth/guards";
import { ROLES, type Role } from "@/types/roles";
import { buildCsp, newNonce } from "@/lib/security/csp";

const AUTH_PREFIXES = ["/login", "/signup"];

// Every response carries a Content-Security-Policy with a fresh script nonce.
// Next reads the policy from the REQUEST headers to put the nonce on its own
// inline scripts, so it is set on both the request and the response.
export async function proxy(request: NextRequest) {
  const nonce = newNonce();
  const csp = buildCsp(nonce);
  request.headers.set("x-nonce", nonce);
  request.headers.set("content-security-policy", csp);
  const result = await route(request);
  result.headers.set("Content-Security-Policy", csp);
  return result;
}

async function route(request: NextRequest) {
  const { supabase, response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  let role: Role | null = null;
  let status: string | null = null;
  let profileCompleted = true;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status, profile_completed")
      .eq("id", user.id)
      .single();
    if (profile && (ROLES as readonly string[]).includes(profile.role)) {
      role = profile.role as Role;
      status = profile.status as string;
      profileCompleted = profile.profile_completed;
    }
  }

  const isAuthRoute = AUTH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isPendingRoute = pathname.startsWith("/pending");
  const isDashboardRoute = pathname.startsWith("/dashboard");

  // Google sign-ups must finish /complete-profile before reaching anything else.
  if (
    user &&
    role &&
    !profileCompleted &&
    (isPendingRoute || isDashboardRoute)
  ) {
    return NextResponse.redirect(new URL("/complete-profile", request.url));
  }

  // Auth routes (/login, /signup/*) — active, logged-in users go to their dashboard
  if (isAuthRoute) {
    if (user && role && status === "active") {
      return NextResponse.redirect(
        new URL(getDashboardPath(role), request.url),
      );
    }
    return response;
  }

  // /pending — active users are sent to their dashboard; logged-out users to /login
  if (isPendingRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role && status === "active") {
      return NextResponse.redirect(
        new URL(getDashboardPath(role), request.url),
      );
    }
    return response;
  }

  // Dashboard routes (/dashboard/admin, /dashboard/member, /dashboard/sponsor, ...)
  if (isDashboardRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!role || !status) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (status === "pending") {
      return NextResponse.redirect(new URL("/pending", request.url));
    }
    if (status === "inactive" || status === "suspended") {
      const url = new URL("/login", request.url);
      url.searchParams.set("error", "account_" + status);
      return NextResponse.redirect(url);
    }
    const correctPath = getDashboardPath(role);
    if (!pathname.startsWith(correctPath)) {
      return NextResponse.redirect(new URL(correctPath, request.url));
    }
    // Admins need a second factor before any admin page (requireRole checks
    // again for Server Actions, which can be posted to any URL).
    if (role === "admin") {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel !== "aal2") {
        return NextResponse.redirect(new URL("/admin-2fa", request.url));
      }
    }
    return response;
  }

  // Everything else is public — allow
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
