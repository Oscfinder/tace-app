import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminSecondFactorSatisfied } from "@/lib/auth/guards";
import { logAudit } from "@/lib/admin/audit";
import {
  financeRowsToCsv,
  getFinanceRows,
  parseFinanceFilters,
} from "@/lib/admin/finance";

// Admin-only CSV of the *filtered* donations. Checked here on the server (not
// just by proxy.ts), and the query itself runs under RLS as the admin.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorised", { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin" || profile.status !== "active") {
    return new NextResponse("Forbidden", { status: 403 });
  }
  if (!(await adminSecondFactorSatisfied())) {
    return new NextResponse("Two-factor sign-in required", { status: 403 });
  }

  const filters = parseFinanceFilters(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  const { rows, truncated } = await getFinanceRows(filters);
  if (truncated) {
    return new NextResponse("Too many rows. Narrow the date range and try again.", {
      status: 413,
    });
  }

  await logAudit(supabase, user.id, "donations_exported", "donations", null, {
    rows: rows.length,
    ...Object.fromEntries(Object.entries(filters).map(([k, v]) => [`filter_${k}`, v])),
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(financeRowsToCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tace-donations-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
