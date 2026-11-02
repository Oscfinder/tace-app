import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { cleanupOrphanedApplicationPhotos } from "@/lib/storage/cleanup";

// Called daily by a cPanel cron job (docs/CRON_SETUP.md) with
// "Authorization: Bearer <CRON_SECRET>". Anything else is refused with 401, so the
// service-role cleanup can't be triggered by the public. The secret is accepted
// in that header only, never in the URL (URLs end up in logs).
// Each run writes one "[cron]" log line (job, time, counts; no personal data).
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret ?? ""}`;
  const ok =
    !!secret &&
    given.length === expected.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) {
    console.warn("[cron] cleanup-photos refused: missing or wrong secret");
    return new NextResponse("Unauthorised", { status: 401 });
  }

  try {
    const result = await cleanupOrphanedApplicationPhotos();
    console.log("[cron] cleanup-photos ok", { at: new Date().toISOString(), ...result });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[cron] cleanup-photos failed", { at: new Date().toISOString(), error: err instanceof Error ? err.message : "unknown" });
    return NextResponse.json({ error: "Cleanup failed." }, { status: 500 });
  }
}
