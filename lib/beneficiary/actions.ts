"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";

type ActionResult = { error: string } | { success: true };

const thankYouSchema = z.object({
  content: z
    .string()
    .trim()
    .min(3, "Please write a few words.")
    .max(1000, "That's a bit long — please keep it under 1000 characters."),
});

const MAX_WAITING = 3;

// The message is saved as 'pending'. The sponsor only ever sees it after an
// admin approves it (RLS: sponsors read status='approved' rows only).
export async function sendThankYou(input: {
  content: string;
}): Promise<ActionResult> {
  const session = await requireRole("beneficiary");
  const parsed = thankYouSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your message." };
  }

  const supabase = await createClient();
  const { data: child } = await supabase
    .from("beneficiaries")
    .select("id, sponsor_id")
    .eq("profile_id", session.user.id)
    .maybeSingle();
  if (!child) return { error: "We couldn't find your profile. Please try again." };
  if (!child.sponsor_id) {
    return { error: "You'll be able to say thank you once you have a sponsor." };
  }

  // Gentle cap so a few messages are reviewed at a time.
  const { count } = await supabase
    .from("thank_you_messages")
    .select("id", { count: "exact", head: true })
    .eq("beneficiary_id", child.id)
    .eq("status", "pending");
  if ((count ?? 0) >= MAX_WAITING) {
    return {
      error:
        "You already have a few messages waiting to be shared. We'll send them first, then you can write more!",
    };
  }

  const { error } = await supabase.from("thank_you_messages").insert({
    beneficiary_id: child.id,
    sponsor_id: child.sponsor_id,
    content: parsed.data.content,
    status: "pending",
  });
  if (error) return { error: "We couldn't save your message. Please try again." };

  revalidatePath("/dashboard/beneficiary/sponsor");
  return { success: true };
}
