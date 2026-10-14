"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { firstOfMonth } from "@/lib/member/queries";

type ActionResult = { error: string } | { success: true };

const updateSchema = z.object({
  content: z.string().trim().min(1, "Please write your update.").max(4000),
});

// One update per member per month: upsert on (member_id, update_month). RLS
// allows insert, and update only for the current month.
export async function saveCommitteeUpdate(input: {
  content: string;
}): Promise<ActionResult> {
  const session = await requireRole("member");
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid update." };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("committee")
    .eq("id", session.user.id)
    .single();
  if (!profile?.committee) {
    return { error: "You aren't assigned to a committee yet." };
  }

  const { error } = await supabase.from("committee_updates").upsert(
    {
      member_id: session.user.id,
      committee: profile.committee,
      update_month: firstOfMonth(),
      content: parsed.data.content,
    },
    { onConflict: "member_id,update_month" },
  );
  if (error) return { error: error.message };

  revalidatePath("/dashboard/member/committee");
  return { success: true };
}

const rsvpSchema = z.object({
  eventId: z.string().uuid(),
  status: z.enum(["attending", "declined"]),
});

export async function setRsvp(input: {
  eventId: string;
  status: "attending" | "declined";
}): Promise<ActionResult> {
  const session = await requireRole("member");
  const parsed = rsvpSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase.from("event_rsvps").upsert(
    {
      event_id: parsed.data.eventId,
      profile_id: session.user.id,
      status: parsed.data.status,
    },
    { onConflict: "event_id,profile_id" },
  );
  if (error) return { error: error.message };

  revalidatePath("/dashboard/member/events");
  return { success: true };
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
};

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your name.").max(120),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+\-()\s]*$/, "Phone can only contain digits, spaces and + - ( )")
    .optional(),
});

// Only full_name, phone and avatar are ever written. role/status/member_type/
// committee/trustee_role are never sent (and the DB trigger reverts them anyway).
export async function updateMemberProfile(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole("member");
  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name") ?? "",
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  const file = formData.get("avatar");
  const avatar = file instanceof File && file.size > 0 ? file : null;
  if (avatar) {
    if (!AVATAR_TYPES[avatar.type]) return { error: "Photo must be a JPG or PNG." };
    if (avatar.size > MAX_AVATAR_BYTES) return { error: "Photo must be under 2MB." };
  }

  const supabase = await createClient();
  const update: { full_name: string; phone: string | null; avatar_url?: string } = {
    full_name: parsed.data.full_name,
    phone: parsed.data.phone || null,
  };

  if (avatar) {
    const path = `${session.user.id}/avatar.${AVATAR_TYPES[avatar.type]}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatar, { upsert: true, contentType: avatar.type });
    if (uploadError) return { error: uploadError.message };
    update.avatar_url = path;
  }

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", session.user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/member", "layout");
  return { success: true };
}
