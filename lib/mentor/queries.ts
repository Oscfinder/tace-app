import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

// Runs under the signed-in mentor's own RLS. Children are only ever read
// through the narrow views (mentor_requests, mentee_profiles) — never the
// beneficiaries table.

export type MentorRequest = Database["public"]["Views"]["mentor_requests"]["Row"];

export async function getMentorContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: mentor }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, status").eq("id", user.id).single(),
    supabase
      .from("mentors")
      .select("id, vetting_status, code_of_conduct_accepted_at")
      .eq("profile_id", user.id)
      .maybeSingle(),
  ]);
  if (!profile || !mentor) return null;
  return {
    userId: user.id,
    fullName: profile.full_name,
    mentorId: mentor.id,
    vettingStatus: mentor.vetting_status,
    codeAcceptedAt: mentor.code_of_conduct_accepted_at,
  };
}

export async function getMentorRequests(): Promise<MentorRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mentor_requests")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}
