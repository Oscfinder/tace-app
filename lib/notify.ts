import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Notifications addressed to OTHER people (the mentor told that a guardian
// accepted, the admins told that a request was declined, ...). Users have no
// RLS permission to write notifications for someone else, so this is the one
// narrow place the service role is used for it. Call it only from a Server
// Action, AFTER the caller's own action has succeeded under their own RLS.
//
// Best-effort: a failed notification must never undo or hide the real action.
export type Notice = {
  profileId: string;
  title: string;
  body?: string;
  type: string;
};

export async function notifyProfiles(notices: Notice[]) {
  const rows = notices
    .filter((n) => n.profileId)
    .map((n) => ({
      profile_id: n.profileId,
      title: n.title,
      body: n.body ?? null,
      type: n.type,
    }));
  if (rows.length === 0) return;
  const admin = createAdminClient();
  const { error } = await admin.from("notifications").insert(rows);
  if (error) console.error("notifyProfiles failed:", error.message);
}

export async function adminProfileIds(): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .eq("status", "active");
  return (data ?? []).map((p) => p.id);
}

// Who is on a match: the mentor's and the child's (guardian's) login profiles.
export async function matchParties(matchId: string) {
  const admin = createAdminClient();
  const { data: match } = await admin
    .from("mentorship_matches")
    .select("id, status, mentor_id, beneficiary_id")
    .eq("id", matchId)
    .maybeSingle();
  if (!match) return null;
  const [{ data: mentor }, { data: child }] = await Promise.all([
    admin.from("mentors").select("profile_id").eq("id", match.mentor_id).maybeSingle(),
    admin
      .from("beneficiaries")
      .select("profile_id, first_name")
      .eq("id", match.beneficiary_id)
      .maybeSingle(),
  ]);
  const { data: mentorProfile } = mentor?.profile_id
    ? await admin.from("profiles").select("full_name").eq("id", mentor.profile_id).maybeSingle()
    : { data: null };
  return {
    status: match.status,
    mentorProfileId: mentor?.profile_id ?? null,
    mentorName: mentorProfile?.full_name ?? "Your mentor",
    guardianProfileId: child?.profile_id ?? null,
    childFirstName: child?.first_name ?? "the child",
  };
}
