"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { COMMITTEE_PREFERENCES } from "@/lib/validations/auth";
import { EVENT_TYPES } from "@/lib/admin/event-constants";

type ActionResult = { error: string } | { success: true };

const eventSchema = z.object({
  title: z.string().trim().min(1, "A title is required.").max(150, "Title is too long."),
  description: z.string().trim().max(2000, "Description is too long.").optional(),
  location: z.string().trim().max(200, "Location is too long.").optional(),
  // ISO timestamp produced by the browser from the date/time picker.
  eventDate: z.string().datetime({ message: "Please choose a date and time." }),
  eventType: z.enum(EVENT_TYPES, { message: "Please choose a type." }),
  // Empty = a general event for everyone.
  committee: z
    .string()
    .refine(
      (v) => v === "" || (COMMITTEE_PREFERENCES as readonly string[]).includes(v),
      "Please choose one of the listed committees.",
    ),
  minutes: z.string().trim().max(20000, "Minutes are too long.").optional(),
});

export type EventInput = z.input<typeof eventSchema>;

function toRow(data: z.output<typeof eventSchema>) {
  return {
    title: data.title,
    description: data.description || null,
    location: data.location || null,
    event_date: data.eventDate,
    event_type: data.eventType,
    committee: data.committee || null,
    minutes: data.minutes || null,
  };
}

function refresh() {
  revalidatePath("/dashboard/admin/content/events");
  revalidatePath("/dashboard/admin");
  // Members see events, committee meetings and minutes.
  revalidatePath("/dashboard/member", "layout");
}

export async function createEvent(input: EventInput): Promise<ActionResult> {
  const session = await requireRole("admin");
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .insert({ ...toRow(parsed.data), created_by: session.user.id });
  if (error) return { error: error.message };
  refresh();
  return { success: true };
}

export async function updateEvent(
  id: string,
  input: EventInput,
): Promise<ActionResult> {
  await requireRole("admin");
  if (!z.string().uuid().safeParse(id).success) return { error: "Invalid event." };
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update(toRow(parsed.data))
    .eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { success: true };
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  await requireRole("admin");
  if (!z.string().uuid().safeParse(id).success) return { error: "Invalid event." };
  const supabase = await createClient();
  // RSVPs cascade (event_rsvps.event_id ON DELETE CASCADE).
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { success: true };
}
