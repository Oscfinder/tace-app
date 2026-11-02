import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// For uptime monitors. Answers only "ok" (200) or "fail" (503): it checks that the
// database answers a trivial query, and says nothing about versions, hosts,
// table names or error text. No sign-in needed, nothing personal is read.
export const dynamic = "force-dynamic";

const TIMEOUT_MS = 5000;
const headers = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const admin = createAdminClient();
    const check = admin.from("site_settings").select("key", { head: true, count: "exact" }).limit(1);
    const result = await Promise.race([
      check,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
    ]);
    if (result.error) throw new Error("database query failed");
    return NextResponse.json({ status: "ok" }, { headers });
  } catch (err) {
    // The reason goes to our private server log only.
    console.error("[health] check failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ status: "fail" }, { status: 503, headers });
  }
}
