"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";

type ActionResult = { error: string } | { success: true };

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your name.").max(120),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+\-()\s]*$/, "Phone can only contain digits, spaces and + - ( )"),
});

// Only name and phone are ever written; role/status are protected by the
// database trigger as well.
export async function updateSponsorProfile(input: {
  full_name: string;
  phone: string;
}): Promise<ActionResult> {
  const session = await requireRole("sponsor");
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name, phone: parsed.data.phone || null })
    .eq("id", session.user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/sponsor", "layout");
  return { success: true };
}
