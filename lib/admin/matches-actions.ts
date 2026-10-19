"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { logAudit } from "@/lib/admin/audit";
import { createMatchCore } from "@/lib/admin/matches-core";
import type { Database } from "@/types/database";

type ActionResult = { error: string } | { success: true };

const uuid = z.string().uuid();

function refresh(beneficiaryId?: string, mentorId?: string) {
  if (beneficiaryId) revalidatePath(`/dashboard/admin/beneficiaries/${beneficiaryId}`);
  if (mentorId) revalidatePath(`/dashboard/admin/mentors/${mentorId}`);
  revalidatePath("/dashboard/admin/mentors");
}

// Used from a child's profile and from a mentor's page.
export async function createMatch(input: {
  beneficiaryId: string;
  mentorId: string;
}): Promise<ActionResult> {
  const session = await requireRole("admin");
  if (!uuid.safeParse(input.beneficiaryId).success || !uuid.safeParse(input.mentorId).success) {
    return { error: "Invalid request." };
  }
  const supabase = await createClient();
  const result = await createMatchCore(supabase, input);
  if ("error" in result) return result;
  await logAudit(supabase, session.user.id, "match_created", "mentorship_match", result.matchId, {
    beneficiary_id: input.beneficiaryId,
    mentor_id: input.mentorId,
  });
  refresh(input.beneficiaryId, input.mentorId);
  return { success: true };
}

const statusSchema = z.object({
  matchId: z.string().uuid(),
  action: z.enum(["pause", "resume", "terminate"]),
  reason: z.string().trim().max(500).optional(),
});

const TRANSITIONS = {
  pause: { from: ["active"], to: "paused" },
  resume: { from: ["paused"], to: "active" },
  terminate: { from: ["pending_consent", "active", "paused"], to: "terminated" },
} as const;

// Pause / resume / terminate. A paused or terminated match blocks messaging at
// once (the message INSERT policy requires status = 'active'). The mentor and
// the guardian are both told.
export async function setMatchStatus(input: {
  matchId: string;
  action: "pause" | "resume" | "terminate";
  reason?: string;
}): Promise<ActionResult> {
  const session = await requireRole("admin");
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid request." };
  const { matchId, action, reason } = parsed.data;
  if (action === "terminate" && !reason) {
    return { error: "Please give a reason for ending this match." };
  }

  const supabase = await createClient();
  const { data: match } = await supabase
    .from("mentorship_matches")
    .select("id, status, mentor_id, beneficiary_id")
    .eq("id", matchId)
    .maybeSingle();
  if (!match) return { error: "Match not found." };

  const rule = TRANSITIONS[action];
  if (!(rule.from as readonly string[]).includes(match.status ?? "")) {
    return { error: `This match is ${match.status}, so it can't be ${action}d.` };
  }

  const update: Database["public"]["Tables"]["mentorship_matches"]["Update"] = {
    status: rule.to,
  };
  if (action === "terminate") {
    update.termination_reason = reason;
    update.ends_at = new Date().toISOString();
  }
  const { error } = await supabase.from("mentorship_matches").update(update).eq("id", matchId);
  if (error) return { error: error.message };

  await logAudit(supabase, session.user.id, `match_${rule.to}`, "mentorship_match", matchId, {
    from: match.status ?? null,
    reason: reason ?? null,
  });

  const [{ data: mentor }, { data: child }] = await Promise.all([
    supabase.from("mentors").select("profile_id").eq("id", match.mentor_id).maybeSingle(),
    supabase
      .from("beneficiaries")
      .select("profile_id, first_name")
      .eq("id", match.beneficiary_id)
      .maybeSingle(),
  ]);
  const verb = { pause: "paused", resume: "resumed", terminate: "ended" }[action];
  const note =
    action === "pause"
      ? "Messaging is switched off while it is paused."
      : action === "resume"
        ? "You can message each other again."
        : "Messaging has stopped.";
  const rows: Database["public"]["Tables"]["notifications"]["Insert"][] = [];
  for (const profileId of [mentor?.profile_id, child?.profile_id]) {
    if (!profileId) continue;
    rows.push({
      profile_id: profileId,
      title: `Mentorship ${verb}`,
      body: `The mentorship with ${child?.first_name ?? "this child"} has been ${verb} by the TACE team. ${note}`,
      type: "match_status",
    });
  }
  if (rows.length > 0) {
    const { error: notifyError } = await supabase.from("notifications").insert(rows);
    if (notifyError) console.error("Match status notifications failed:", notifyError.message);
  }

  refresh(match.beneficiary_id, match.mentor_id);
  return { success: true };
}

