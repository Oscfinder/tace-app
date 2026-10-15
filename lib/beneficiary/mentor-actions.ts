"use server";

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

const schema = z.object({
  matchId: z.string().uuid(),
  decision: z.enum(["accept", "decline"]),
});

// The guardian's side of consent (the child's account is the guardian's
// login). Accepting sets only consent_guardian; declining ends the request.
// An admin can never do this on anyone's behalf, and "active" is set only by
// the database trigger once both sides have accepted.
export async function respondToGuardianRequest(input: {
  matchId: string;
  decision: "accept" | "decline";
}): Promise<ActionResult> {
  await requireRole("beneficiary");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "Invalid request." };
  const { matchId, decision } = parsed.data;

  const supabase = await createClient();
  // Visible only if it is a pending request for THIS child.
  const { data: request } = await supabase
    .from("my_mentor_request")
    .select("match_id")
    .eq("match_id", matchId)
    .maybeSingle();
  if (!request) return { error: "This request isn't available any more." };

  const { error } = await supabase
    .from("mentorship_matches")
    .update(decision === "accept" ? { consent_guardian: true } : { status: "terminated" })
    .eq("id", matchId);
  if (error) return { error: "We couldn't save your answer. Please try again." };

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
      if (parties.mentorProfileId) {
        notices.push({
          profileId: parties.mentorProfileId,
          title: "Mentoring request update",
          body: `${parties.childFirstName}'s guardian has decided not to go ahead with this mentorship. Thank you for being willing.`,
          type: "match_status",
        });
      }
      for (const id of await adminProfileIds()) {
        notices.push({
          profileId: id,
          title: "Guardian declined a mentor",
          body: `${parties.childFirstName}'s guardian declined ${parties.mentorName}. A new match may be needed.`,
          type: "match_status",
        });
      }
    } else if (activated) {
      for (const id of [parties.mentorProfileId, parties.guardianProfileId]) {
        if (!id) continue;
        notices.push({
          profileId: id,
          title: "Your mentorship is now active 🎉",
          body: `${parties.mentorName} and ${parties.childFirstName} can now message each other.`,
          type: "match_status",
        });
      }
    } else if (parties.mentorProfileId) {
      notices.push({
        profileId: parties.mentorProfileId,
        title: "Guardian accepted",
        body: `${parties.childFirstName}'s guardian has accepted. The mentorship starts once you accept too.`,
        type: "mentor_request",
      });
    }
    await notifyProfiles(notices);
  }

  revalidatePath("/dashboard/beneficiary", "layout");
  return { success: true, activated };
}
