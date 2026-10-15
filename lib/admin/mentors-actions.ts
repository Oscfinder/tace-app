"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { sendEmail } from "@/lib/email/send";
import { getSiteUrl } from "@/lib/site-url";
import { VETTING_ITEMS, checklistComplete } from "@/lib/mentoring/constants";

type ActionResult = { error: string } | { success: true };

const checklistSchema = z.object(
  Object.fromEntries(VETTING_ITEMS.map((i) => [i.key, z.boolean().optional()])),
);
const baseSchema = z.object({
  mentorId: z.string().uuid(),
  checklist: checklistSchema,
  notes: z.string().trim().max(4000),
});

// Store every item as an explicit true/false.
function normaliseChecklist(c: Record<string, boolean | undefined>): Record<string, boolean> {
  return Object.fromEntries(VETTING_ITEMS.map((i) => [i.key, c[i.key] === true]));
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

async function loadMentor(supabase: Awaited<ReturnType<typeof createClient>>, mentorId: string) {
  const { data: mentor } = await supabase
    .from("mentors")
    .select("id, profile_id, vetting_status")
    .eq("id", mentorId)
    .maybeSingle();
  if (!mentor?.profile_id) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, status")
    .eq("id", mentor.profile_id)
    .single();
  return profile ? { mentor, profile } : null;
}

function refresh(mentorId: string) {
  revalidatePath(`/dashboard/admin/mentors/${mentorId}`);
  revalidatePath("/dashboard/admin/mentors");
}

// Save the checklist and notes without deciding yet.
export async function saveVettingProgress(input: {
  mentorId: string;
  checklist: Record<string, boolean | undefined>;
  notes: string;
}): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = baseSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("mentors")
    .update({
      vetting_checklist: normaliseChecklist(parsed.data.checklist),
      vetting_notes: parsed.data.notes || null,
    })
    .eq("id", parsed.data.mentorId);
  if (error) return { error: error.message };
  refresh(parsed.data.mentorId);
  return { success: true };
}

// ONLY this action (and reject below) can change vetting_status; the database
// refuses it from anyone but an admin. Clearing needs all four checks ticked.
export async function clearMentor(input: {
  mentorId: string;
  checklist: Record<string, boolean | undefined>;
  notes: string;
}): Promise<ActionResult> {
  const session = await requireRole("admin");
  const parsed = baseSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form." };
  if (!checklistComplete(parsed.data.checklist)) {
    return { error: "Tick all four checks before clearing this mentor." };
  }
  const supabase = await createClient();
  const found = await loadMentor(supabase, parsed.data.mentorId);
  if (!found) return { error: "Mentor not found." };

  const { error } = await supabase
    .from("mentors")
    .update({
      vetting_status: "cleared",
      vetting_checklist: normaliseChecklist(parsed.data.checklist),
      vetting_notes: parsed.data.notes || null,
      vetted_by: session.user.id,
      vetted_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.mentorId);
  if (error) return { error: error.message };

  try {
    await sendEmail({
      to: found.profile.email,
      subject: "TACE Foundation — you have been cleared as a mentor",
      html: `<p>Hi ${escapeHtml(found.profile.full_name)},</p>
<p>Thank you for completing our vetting process. We are pleased to tell you that you have been <strong>cleared</strong> as a TACE mentor.</p>
<p>${found.profile.status === "active" ? `You can now <a href="${getSiteUrl()}/login">sign in</a>.` : "We will activate your account shortly and email you when it is ready."}</p>`,
    });
  } catch (err) {
    console.error("Clearance email failed:", err);
  }

  refresh(parsed.data.mentorId);
  return { success: true };
}

// Reject: records the decision, and as a safeguard also deactivates the
// account and ends any open matches (a child must not stay matched to a
// mentor who isn't cleared).
export async function rejectMentor(input: {
  mentorId: string;
  checklist: Record<string, boolean | undefined>;
  notes: string;
}): Promise<ActionResult> {
  const session = await requireRole("admin");
  const parsed = baseSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form." };
  if (!parsed.data.notes) {
    return { error: "Please add a note explaining the decision." };
  }
  const supabase = await createClient();
  const found = await loadMentor(supabase, parsed.data.mentorId);
  if (!found) return { error: "Mentor not found." };

  const { error } = await supabase
    .from("mentors")
    .update({
      vetting_status: "rejected",
      vetting_checklist: normaliseChecklist(parsed.data.checklist),
      vetting_notes: parsed.data.notes,
      vetted_by: session.user.id,
      vetted_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.mentorId);
  if (error) return { error: error.message };

  if (found.profile.status === "active") {
    await supabase.from("profiles").update({ status: "inactive" }).eq("id", found.profile.id);
  }
  const now = new Date().toISOString();
  const { data: ended } = await supabase
    .from("mentorship_matches")
    .update({
      status: "terminated",
      termination_reason: "Mentor not cleared by vetting",
      ends_at: now,
    })
    .eq("mentor_id", parsed.data.mentorId)
    .in("status", ["pending_consent", "active", "paused"])
    .select("beneficiary_id");

  if (ended && ended.length > 0) {
    const { data: kids } = await supabase
      .from("beneficiaries")
      .select("profile_id, first_name")
      .in("id", ended.map((e) => e.beneficiary_id));
    const rows = (kids ?? [])
      .filter((k) => k.profile_id)
      .map((k) => ({
        profile_id: k.profile_id!,
        title: "Mentor match ended",
        body: `The mentor match for ${k.first_name} has ended. The TACE team will be in touch about a new mentor.`,
        type: "match_status",
      }));
    if (rows.length > 0) await supabase.from("notifications").insert(rows);
  }

  try {
    await sendEmail({
      to: found.profile.email,
      subject: "TACE Foundation — update on your mentor application",
      html: `<p>Hi ${escapeHtml(found.profile.full_name)},</p>
<p>Thank you for your interest in mentoring with TACE Foundation. After careful review, we are unable to take your application forward at this time.</p>
<p>We appreciate the time you gave to the process. If you have questions, please reply to this email.</p>`,
    });
  } catch (err) {
    console.error("Rejection email failed:", err);
  }

  refresh(parsed.data.mentorId);
  return { success: true };
}

// A separate step from clearing, and only possible once cleared.
export async function activateMentorAccount(input: {
  mentorId: string;
}): Promise<ActionResult> {
  await requireRole("admin");
  if (!z.string().uuid().safeParse(input.mentorId).success) return { error: "Invalid request." };
  const supabase = await createClient();
  const found = await loadMentor(supabase, input.mentorId);
  if (!found) return { error: "Mentor not found." };
  if (found.mentor.vetting_status !== "cleared") {
    return { error: "Clear this mentor through vetting before activating their account." };
  }
  if (found.profile.status === "active") return { error: "This account is already active." };

  const { error } = await supabase
    .from("profiles")
    .update({ status: "active" })
    .eq("id", found.profile.id);
  if (error) return { error: error.message };

  try {
    await sendEmail({
      to: found.profile.email,
      subject: "TACE Foundation — your mentor account is active",
      html: `<p>Hi ${escapeHtml(found.profile.full_name)},</p>
<p>Your mentor account is now active. <a href="${getSiteUrl()}/login">Sign in</a> to read and accept the code of conduct and to see any mentoring requests.</p>`,
    });
  } catch (err) {
    console.error("Activation email failed:", err);
  }

  refresh(input.mentorId);
  return { success: true };
}
