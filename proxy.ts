import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getDashboardPath } from "@/lib/auth/guards";
import { ROLES, type Role } from "@/types/roles";

const AUTH_PREFIXES = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const { supabase, response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  let role: Role | null = null;
  let status: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();
    if (profile && (ROLES as readonly string[]).includes(profile.role)) {
      role = profile.role as Role;
      status = profile.status as string;
    }
  }

  const isAuthRoute = AUTH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isPendingRoute = pathname.startsWith("/pending");
  const isDashboardRoute = pathname.startsWith("/dashboard");

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
