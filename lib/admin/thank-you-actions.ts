"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";

type ActionResult = { error: string } | { success: true };

const schema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
});

export async function reviewThankYou(input: {
  id: string;
  decision: "approved" | "rejected";
}): Promise<ActionResult> {
  const session = await requireRole("admin");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();

  // Only pending messages can be reviewed (no flip-flopping after the fact).
  const { data: message, error } = await supabase
    .from("thank_you_messages")
    .update({
      status: parsed.data.decision,
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("status", "pending")
    .select("id, sponsor_id, beneficiary_id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!message) return { error: "This message has already been reviewed." };

  // Once approved the sponsor can read it (RLS); also let them know.
  if (parsed.data.decision === "approved" && message.sponsor_id) {
    const [{ data: sponsor }, { data: child }] = await Promise.all([
      supabase
        .from("sponsors")
        .select("profile_id")
        .eq("id", message.sponsor_id)
        .maybeSingle(),
      supabase
        .from("beneficiaries")
        .select("first_name")
        .eq("id", message.beneficiary_id)
        .maybeSingle(),
    ]);
    if (sponsor?.profile_id) {
      const { error: notifyError } = await supabase.from("notifications").insert({
        profile_id: sponsor.profile_id,
        title: `A thank-you from ${child?.first_name ?? "the child you sponsor"} 💙`,
        body: "You have a new thank-you message waiting for you.",
        type: "thank_you",
      });
      if (notifyError) {
        console.error("Sponsor notification failed:", notifyError.message);
      }
    }
  }

  revalidatePath("/dashboard/admin/thank-you-messages");
  return { success: true };
}
