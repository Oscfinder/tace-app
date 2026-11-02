import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailContext, sendEmail } from "@/lib/email/send";
import { weeklyDigest } from "@/lib/email/templates";

// Called every Monday by a cPanel cron job (docs/CRON_SETUP.md) with
// "Authorization: Bearer <CRON_SECRET>" (header only, never in the URL; anything
// else is refused with 401). Emails each active admin a count of
// open safeguarding concerns, flagged messages and waiting applications.
// Numbers only: no names, no message text.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret ?? ""}`;
  const ok =
    !!secret &&
    given.length === expected.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) {
    console.warn("[cron] weekly-digest refused: missing or wrong secret");
    return new NextResponse("Unauthorised", { status: 401 });
  }

  try {
    const db = createAdminClient();
    const count = async (q: PromiseLike<{ count: number | null; error: { message: string } | null }>) => {
      const { count, error } = await q;
      if (error) throw new Error(error.message);
      return count ?? 0;
    };
    const [openConcerns, flaggedMessages, pendingApplications] = await Promise.all([
      count(db.from("safeguarding_concerns").select("id", { count: "exact", head: true }).in("status", ["open", "reviewing"])),
      count(db.from("mentorship_messages").select("id", { count: "exact", head: true }).eq("is_flagged", true)),
      count(db.from("applications").select("id", { count: "exact", head: true }).in("status", ["pending", "flagged"])),
    ]);

    const { data: admins, error } = await db
      .from("profiles")
      .select("email")
      .eq("role", "admin")
      .eq("status", "active");
    if (error) throw new Error(error.message);

    const email = weeklyDigest(emailContext(), { openConcerns, flaggedMessages, pendingApplications });
    let sent = 0;
    for (const a of admins ?? []) {
      if (!a.email) continue;
      try {
        await sendEmail({ to: a.email, ...email });
        sent++;
      } catch (err) {
        console.error("Weekly digest email failed:", err instanceof Error ? err.message : "unknown");
      }
    }
    const result = { openConcerns, flaggedMessages, pendingApplications, sent };
    console.log("[cron] weekly-digest ok", { at: new Date().toISOString(), ...result });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[cron] weekly-digest failed", { at: new Date().toISOString(), error: err instanceof Error ? err.message : "unknown" });
    return NextResponse.json({ error: "Digest failed." }, { status: 500 });
  }
}
