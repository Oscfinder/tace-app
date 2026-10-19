import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { cleanupOrphanedApplicationPhotos } from "@/lib/storage/cleanup";

// Called daily by Vercel Cron (see vercel.json). Vercel sends
// "Authorization: Bearer <CRON_SECRET>"; anything else is refused, so the
// service-role cleanup can't be triggered by the public.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret ?? ""}`;
  const ok =
    !!secret &&
    given.length === expected.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return new NextResponse("Unauthorised", { status: 401 });

  try {
    const result = await cleanupOrphanedApplicationPhotos();
    console.log("Orphaned photo cleanup:", result);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Orphaned photo cleanup failed:", err);
    return NextResponse.json({ error: "Cleanup failed." }, { status: 500 });
  }
}
