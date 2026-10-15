"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import {
  adminProfileIds,
  matchParties,
  notifyProfiles,
  type Notice,
} from "@/lib/notify";
import { MENTOR_AVAILABILITY } from "@/lib/validations/auth";

type ActionResult = { error: string } | { success: true; activated?: boolean };

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

// First sign-in: a required tick plus the typed full name. The timestamp is
// set by the database clock (a trigger), never by the browser.
export async function acceptCodeOfConduct(input: {
  agreed: boolean;
  typedName: string;
}): Promise<{ error: string } | never> {
  const session = await requireRole("mentor");
  if (input.agreed !== true) return { error: "Please tick the box to confirm you agree." };

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", session.user.id)
    .single();
  if (!profile) return { error: "Could not load your profile. Please try again." };
  if (norm(input.typedName) !== norm(profile.full_name)) {
    return { error: "Please type your full name exactly as it appears on your account." };
  }

  const { error } = await supabase
    .from("mentors")
    .update({ code_of_conduct_accepted_at: new Date().toISOString() })
    .eq("profile_id", session.user.id);
  if (error) return { error: "We couldn't save that. Please try again." };

  redirect("/dashboard/mentor");
}

const respondSchema = z.object({
  matchId: z.string().uuid(),
  decision: z.enum(["accept", "decline"]),
});

// The mentor's side of consent. Accepting sets only consent_mentor; DECLINING
// ends the request. The database trigger decides when a match turns active —
// this code never sets "active".
export async function respondToMentorRequest(input: {
  matchId: string;
  decision: "accept" | "decline";
}): Promise<ActionResult> {
  await requireRole("mentor");
  const parsed = respondSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid request." };
  const { matchId, decision } = parsed.data;

  const supabase = await createClient();
  // Visible only if it is this mentor's own pending request.
  const { data: request } = await supabase
    .from("mentor_requests")
    .select("match_id")
    .eq("match_id", matchId)
    .maybeSingle();
  if (!request) return { error: "This request isn't available any more." };

  const { error } = await supabase
    .from("mentorship_matches")
    .update(decision === "accept" ? { consent_mentor: true } : { status: "terminated" })
    .eq("id", matchId);
  if (error) return { error: "We couldn't save your answer. Please try again." };

  // What happened as a result (the trigger may have activated the match)?
  const { data: after } = await supabase
    .from("mentorship_matches")
    .select("status")
    .eq("id", matchId)
    .maybeSingle();
  const activated = after?.status === "active";

  const parties = await matchParties(matchId);
  if (parties) {
    const notices: Notice[] = [];
    if (decision === "decline") {
      if (parties.guardianProfileId) {
        notices.push({
          profileId: parties.guardianProfileId,
          title: "Mentor request update",
          body: `${parties.mentorName} isn't able to mentor ${parties.childFirstName} right now. The TACE team will look for another mentor.`,
          type: "match_status",
        });
      }
      for (const id of await adminProfileIds()) {
        notices.push({
          profileId: id,
          title: "Mentor declined a request",
          body: `${parties.mentorName} declined to mentor ${parties.childFirstName}. A new match is needed.`,
          type: "match_status",
        });
      }
    } else if (activated) {
      for (const id of [parties.guardianProfileId, parties.mentorProfileId]) {
        if (!id) continue;
        notices.push({
          profileId: id,
          title: "Your mentorship is now active 🎉",
          body: `${parties.mentorName} and ${parties.childFirstName} can now message each other.`,
          type: "match_status",
        });
      }
    } else if (parties.guardianProfileId) {
      notices.push({
        profileId: parties.guardianProfileId,
        title: "A mentor accepted",
        body: `${parties.mentorName} has accepted to mentor ${parties.childFirstName}. Please review and accept the request too.`,
        type: "mentor_request",
      });
    }
    await notifyProfiles(notices);
  }

  revalidatePath("/dashboard/mentor");
  return { success: true, activated };
}

// ── 4C: working with an active mentee ───────────────────────────────────

const uuid = z.string().uuid();

// Resolve a child id to the caller's own ACTIVE match through mentee_profiles
// (which only returns this mentor's active mentees). Anything else is "not
// found", so a mentor can't act on a child they don't mentor.
async function ownMatchFor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  beneficiaryId: string,
) {
  const { data } = await supabase
    .from("mentee_profiles")
    .select("match_id, first_name")
    .eq("id", beneficiaryId)
    .maybeSingle();
  return data;
}

const noteSchema = z.object({
  beneficiaryId: uuid,
  topics: z.string().trim().min(1, "Please say what you talked about.").max(2000),
  improvements: z.string().trim().max(2000).optional(),
  concerns: z.string().trim().max(2000).optional(),
  nextSteps: z.string().trim().max(2000).optional(),
  checkInDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose the date of the check-in.")
    .refine((d) => new Date(d) <= new Date(), "The check-in date can't be in the future."),
});

// Monthly notes are an append-only record (the database allows insert and read,
// not edit or delete). Admin can read them all.
export async function addMentoringNote(input: {
  beneficiaryId: string;
  topics: string;
  improvements?: string;
  concerns?: string;
  nextSteps?: string;
  checkInDate: string;
}): Promise<ActionResult> {
  const session = await requireRole("mentor");
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const own = await ownMatchFor(supabase, d.beneficiaryId);
  if (!own) return { error: "You can only write notes for your own active mentees." };
  const { data: mentor } = await supabase
    .from("mentors")
    .select("id")
    .eq("profile_id", session.user.id)
    .maybeSingle();
  if (!mentor) return { error: "Your mentor profile couldn't be found." };

  const { error } = await supabase.from("mentorship_notes").insert({
    match_id: own.match_id,
    mentor_id: mentor.id,
    topics_discussed: d.topics,
    improvements: d.improvements || null,
    concerns: d.concerns || null,
    next_steps: d.nextSteps || null,
    check_in_date: d.checkInDate,
  });
  if (error) return { error: "We couldn't save your notes. Please try again." };

  revalidatePath(`/dashboard/mentor/mentees/${d.beneficiaryId}`);
  return { success: true };
}

const checkInSchema = z.object({
  beneficiaryId: uuid,
  // ISO timestamp from the date/time picker; null clears it.
  when: z.string().datetime().nullable(),
});

// Sets mentorship_matches.next_check_in (the database lets only the match's
// mentor change it, and only while the match is active). The child's My Mentor
// page then shows it instead of "Not scheduled yet".
export async function scheduleCheckIn(input: {
  beneficiaryId: string;
  when: string | null;
}): Promise<ActionResult> {
  await requireRole("mentor");
  const parsed = checkInSchema.safeParse(input);
  if (!parsed.success) return { error: "Please choose a valid date and time." };
  const { beneficiaryId, when } = parsed.data;
  if (when) {
    const t = new Date(when).getTime();
    if (t < Date.now() - 60_000) return { error: "Please choose a time in the future." };
    if (t > Date.now() + 366 * 86400000) return { error: "Please choose a date within the next year." };
  }

  const supabase = await createClient();
  const own = await ownMatchFor(supabase, beneficiaryId);
  if (!own) return { error: "You can only schedule check-ins for your own active mentees." };

  const { error } = await supabase
    .from("mentorship_matches")
    .update({ next_check_in: when })
    .eq("id", own.match_id);
  if (error) return { error: "We couldn't save the check-in. Please try again." };

  if (when) {
    const parties = await matchParties(own.match_id);
    if (parties?.guardianProfileId) {
      await notifyProfiles([
        {
          profileId: parties.guardianProfileId,
          title: "Next check-in scheduled",
          body: `${parties.mentorName} has scheduled your next check-in for ${new Date(when).toLocaleString("en-NG", {
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "numeric",
            minute: "2-digit",
          })}.`,
          type: "check_in",
        },
      ]);
    }
  }

  revalidatePath(`/dashboard/mentor/mentees/${beneficiaryId}`);
  revalidatePath("/dashboard/mentor");
  revalidatePath("/dashboard/beneficiary/mentor");
  return { success: true };
}

const concernSchema = z.object({
  beneficiaryId: uuid,
  description: z
    .string()
    .trim()
    .min(1, "Please describe your concern.")
    .max(2000, "That's a bit long: please keep it under 2000 characters."),
});

// Inserts a safeguarding_concerns row (the database only allows it for a child
// this mentor actively mentors) and tells every admin straight away.
export async function raiseConcern(input: {
  beneficiaryId: string;
  description: string;
}): Promise<ActionResult> {
  const session = await requireRole("mentor");
  const parsed = concernSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please describe your concern." };
  }
  const { beneficiaryId, description } = parsed.data;

  const supabase = await createClient();
  const own = await ownMatchFor(supabase, beneficiaryId);
  if (!own) return { error: "You can only raise a concern about your own active mentees." };

  const { error } = await supabase.from("safeguarding_concerns").insert({
    raised_by: session.user.id,
    beneficiary_id: beneficiaryId,
    match_id: own.match_id,
    description,
  });
  if (error) return { error: "We couldn't send your concern. Please try again." };

  const admins = await adminProfileIds();
  await notifyProfiles(
    admins.map((id) => ({
      profileId: id,
      title: "Safeguarding concern raised",
      body: `A mentor raised a concern about ${own.first_name}. Please review it in Concerns.`,
      type: "safeguarding",
    })),
  );

  revalidatePath("/dashboard/admin/concerns");
  revalidatePath("/dashboard/admin");
  return { success: true };
}

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name.").max(120),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+\-()\s]*$/, "Phone can only contain digits, spaces and + - ( )"),
  availability: z.enum(MENTOR_AVAILABILITY).nullable(),
  expertise: z.string().trim().max(300).optional(),
});

// Editable: name, phone, availability, expertise. Vetting fields, track and
// profile link are locked by the database trigger and shown read-only.
export async function updateMentorProfile(input: {
  fullName: string;
  phone: string;
  availability: string | null;
  expertise: string;
}): Promise<ActionResult> {
  const session = await requireRole("mentor");
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: d.fullName, phone: d.phone || null })
    .eq("id", session.user.id);
  if (profileError) return { error: "We couldn't save your details. Please try again." };

  const { error: mentorError } = await supabase
    .from("mentors")
    .update({ availability: d.availability, expertise: d.expertise || null })
    .eq("profile_id", session.user.id);
  if (mentorError) return { error: "We couldn't save your details. Please try again." };

  revalidatePath("/dashboard/mentor", "layout");
  return { success: true };
}
