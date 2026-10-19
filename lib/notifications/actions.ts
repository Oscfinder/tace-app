"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/guards";

type ActionResult = { error: string } | { success: true };

// RLS limits both writes to the caller's own rows, and the column-guard
// trigger limits what they can change to is_read.
export async function markNotificationRead(id: string): Promise<ActionResult> {
  await requireAuth();
  if (!z.string().uuid().safeParse(id).success) return { error: "Invalid request." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard", "layout");
  return { success: true };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  await requireAuth();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);
  if (error) return { error: error.message };
  revalidatePath("/dashboard", "layout");
  return { success: true };
}
