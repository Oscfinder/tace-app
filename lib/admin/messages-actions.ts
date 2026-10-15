"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";

type ActionResult = { error: string } | { success: true };

const schema = z.object({
  messageId: z.string().uuid(),
  reason: z.string().trim().min(1, "Please give a reason.").max(300, "Please keep the reason under 300 characters."),
});

// Admin may change ONLY the flag fields of a message; the database refuses any
// other change (the words, sender and time can never be edited, not even here).
// Every decision is written to the audit log.
async function setFlag(
  input: { messageId: string; reason: string },
  flagged: boolean,
): Promise<ActionResult> {
  const session = await requireRole("admin");
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please give a reason." };
  }
  const { messageId, reason } = parsed.data;

  const supabase = await createClient();
  const { data: message, error } = await supabase
    .from("mentorship_messages")
    .update({
      is_flagged: flagged,
      // Keep the trail visible on the transcript after un-flagging.
      flag_reason: flagged ? reason : `Reviewed and cleared: ${reason}`,
      flagged_by: session.user.id,
      flagged_at: new Date().toISOString(),
    })
    .eq("id", messageId)
    .select("id, match_id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!message) return { error: "Message not found." };

  await supabase.from("audit_log").insert({
    user_id: session.user.id,
    action: flagged ? "message_flagged" : "message_unflagged",
    entity_type: "mentorship_message",
    entity_id: message.id,
    details: { reason, match_id: message.match_id },
  });

  revalidatePath("/dashboard/admin/messages");
  revalidatePath(`/dashboard/admin/messages/${message.match_id}`);
  return { success: true };
}

export async function flagMessage(input: { messageId: string; reason: string }) {
  return setFlag(input, true);
}

export async function unflagMessage(input: { messageId: string; reason: string }) {
  return setFlag(input, false);
}
