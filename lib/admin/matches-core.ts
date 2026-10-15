import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_ACTIVE_MENTEES } from "@/lib/mentoring/constants";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;
export type CoreResult = { error: string } | { success: true; matchId: string };

// Mentees a mentor already has or has been asked to take (active or waiting on
// consent). Counting the waiting ones stops a mentor being over-allocated by a
// batch of requests that haven't been answered yet.
export async function getMentorLoads(supabase: Client): Promise<Map<string, number>> {
  const { data } = await supabase
    .from("mentorship_matches")
    .select("mentor_id")
    .in("status", ["active", "pending_consent"]);
  const loads = new Map<string, number>();
  for (const row of data ?? []) {
    loads.set(row.mentor_id, (loads.get(row.mentor_id) ?? 0) + 1);
  }
  return loads;
}

/**
 * Create a pending_consent match. Every rule is checked here AND the database
 * enforces the important ones (cleared mentor, always pending, no pre-set
 * consent) — so skipping this function would not bypass them.
 * Call as an admin (uses the admin's own client, so RLS applies).
 */
export async function createMatchCore(
  supabase: Client,
  input: { beneficiaryId: string; mentorId: string },
): Promise<CoreResult> {
  const { data: existing } = await supabase
    .from("mentorship_matches")
    .select("id")
    .eq("beneficiary_id", input.beneficiaryId)
    .in("status", ["pending_consent", "active", "paused"])
    .maybeSingle();
  if (existing) {
    return { error: "This child already has a pending, active or paused mentor match." };
  }

  const { data: mentor } = await supabase
    .from("mentors")
    .select("id, profile_id, vetting_status")
    .eq("id", input.mentorId)
    .maybeSingle();
  if (!mentor) return { error: "Mentor not found." };
  if (mentor.vetting_status !== "cleared") {
    return { error: "This mentor has not been cleared by vetting, so can't be matched." };
  }
  const { data: profile } = mentor.profile_id
    ? await supabase.from("profiles").select("status").eq("id", mentor.profile_id).maybeSingle()
    : { data: null };
  if (profile?.status !== "active") {
    return { error: "This mentor's account isn't active yet." };
  }

  const loads = await getMentorLoads(supabase);
  if ((loads.get(mentor.id) ?? 0) >= MAX_ACTIVE_MENTEES) {
    return {
      error: `This mentor already has ${MAX_ACTIVE_MENTEES} mentees (the maximum). Choose another mentor.`,
    };
  }

  const { data: match, error } = await supabase
    .from("mentorship_matches")
    .insert({
      beneficiary_id: input.beneficiaryId,
      mentor_id: input.mentorId,
      status: "pending_consent",
    })
    .select("id")
    .single();
  if (error || !match) {
    return { error: error?.message ?? "Could not create the match." };
  }

  // Tell both sides (the admin's RLS allows writing notifications).
  const [{ data: child }, { data: mentorProfile }] = await Promise.all([
    supabase
      .from("beneficiaries")
      .select("profile_id, first_name, date_of_birth")
      .eq("id", input.beneficiaryId)
      .maybeSingle(),
    mentor.profile_id
      ? supabase.from("profiles").select("full_name").eq("id", mentor.profile_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const notices: Database["public"]["Tables"]["notifications"]["Insert"][] = [];
  if (mentor.profile_id) {
    notices.push({
      profile_id: mentor.profile_id,
      title: "New mentoring request",
      body: `${child?.first_name ?? "A child"} would like you as a mentor. Open your dashboard to accept or decline.`,
      type: "mentor_request",
    });
  }
  if (child?.profile_id) {
    notices.push({
      profile_id: child.profile_id,
      title: "A mentor has been suggested for you",
      body: `${mentorProfile?.full_name ?? "A mentor"} could be ${child.first_name}'s mentor. Please review the request and accept or decline.`,
      type: "mentor_request",
    });
  }
  if (notices.length > 0) {
    const { error: notifyError } = await supabase.from("notifications").insert(notices);
    if (notifyError) console.error("Match notifications failed:", notifyError.message);
  }

  return { success: true, matchId: match.id };
}
