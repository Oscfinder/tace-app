import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminSecondFactorSatisfied } from "@/lib/auth/guards";
import { logAudit } from "@/lib/admin/audit";
import { buildChildExport } from "@/lib/admin/data-requests";

// Admin-only download of everything held about one child (a data access
// request). Checks the caller itself, then runs the queries as that admin so
// row-level security still applies.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return new NextResponse("Not found", { status: 404 });
  }
  const data = await buildChildExport(id);
  if (!data) return new NextResponse("Not found", { status: 404 });

  await logAudit(supabase, user.id, "beneficiary_data_exported", "beneficiary", id, {
    tace_id: data.child.tace_id ?? null,
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const name = (data.child.tace_id ?? "child").replace(/[^A-Za-z0-9_-]/g, "");
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="tace-data-${name}-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
