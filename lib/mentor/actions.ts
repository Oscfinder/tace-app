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
