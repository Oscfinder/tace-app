import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

// Runs under the signed-in mentor's own RLS. Children are only ever read
// through the narrow views (mentor_requests, mentee_profiles) — never the
// beneficiaries or applications tables, and never guardian details.

export type MentorRequest = Database["public"]["Views"]["mentor_requests"]["Row"];
export type Mentee = Database["public"]["Views"]["mentee_profiles"]["Row"] & {
  photoUrl: string | null;
  nextCheckIn: string | null;
};
export type NoteRow = Database["public"]["Tables"]["mentorship_notes"]["Row"];
export type CareerAssessmentRow =
  Database["public"]["Tables"]["career_assessments"]["Row"];

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

// Active mentees only (the view only returns children with an ACTIVE match),
// with a signed photo and the next scheduled check-in.
export async function getMentees(): Promise<Mentee[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("mentee_profiles").select("*").order("first_name");
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const { data: matches } = await supabase
    .from("mentorship_matches")
    .select("id, next_check_in")
    .in("id", rows.map((r) => r.match_id));
  const checkIn = new Map((matches ?? []).map((m) => [m.id, m.next_check_in]));

  return Promise.all(
    rows.map(async (r) => {
      let photoUrl: string | null = null;
      // Readable only once the photo lives under {child_id}/ (migration 008).
      if (r.photo_url && r.photo_url.startsWith(`${r.id}/`)) {
        const { data: signed } = await supabase.storage
          .from("beneficiary-photos")
          .createSignedUrl(r.photo_url, 3600);
        photoUrl = signed?.signedUrl ?? null;
      }
      return { ...r, photoUrl, nextCheckIn: checkIn.get(r.match_id) ?? null };
    }),
  );
}

// Mentees with a check-in coming up (or just started), soonest first.
export function upcomingCheckIns(mentees: Mentee[]): Mentee[] {
  const cutoff = Date.now() - 3600_000;
  return mentees
    .filter((m) => m.nextCheckIn && new Date(m.nextCheckIn).getTime() >= cutoff)
    .sort(
      (a, b) =>
        new Date(a.nextCheckIn!).getTime() - new Date(b.nextCheckIn!).getTime(),
    );
}

export async function getMentee(beneficiaryId: string) {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("mentee_profiles")
    .select("*")
    .eq("id", beneficiaryId)
    .maybeSingle();
  // Not this mentor's active mentee (or not a mentee at all): nothing to show.
  if (!row) return null;

  const [{ data: match }, { data: notes }, { data: assessment }] = await Promise.all([
    supabase
      .from("mentorship_matches")
      .select("id, next_check_in, started_at")
      .eq("id", row.match_id)
      .maybeSingle(),
    supabase
      .from("mentorship_notes")
      .select("*")
      .eq("match_id", row.match_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("career_assessments")
      .select("*")
      .eq("beneficiary_id", beneficiaryId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let photoUrl: string | null = null;
  if (row.photo_url && row.photo_url.startsWith(`${row.id}/`)) {
    const { data: signed } = await supabase.storage
      .from("beneficiary-photos")
      .createSignedUrl(row.photo_url, 3600);
    photoUrl = signed?.signedUrl ?? null;
  }

  return {
    mentee: row,
    photoUrl,
    matchId: row.match_id,
    nextCheckIn: match?.next_check_in ?? null,
    startedAt: match?.started_at ?? null,
    notes: (notes ?? []) as NoteRow[],
    assessment: (assessment ?? null) as CareerAssessmentRow | null,
  };
}

// Messages from the child's side that this mentor hasn't opened yet. (The chat
// itself is Ticket 4D; this just feeds the Home count.)
export async function getUnreadMessageCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("mentorship_messages")
    .select("id", { count: "exact", head: true })
    .is("read_at", null)
    .neq("sender_id", userId);
  return count ?? 0;
}

export async function getMentorProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ data: profile }, { data: mentor }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("id", user.id)
      .single(),
    supabase
      .from("mentors")
      .select(
        "id, profession, expertise, availability, mentor_track, preferred_age_group, vetting_status, vetted_at, code_of_conduct_accepted_at",
      )
      .eq("profile_id", user.id)
      .maybeSingle(),
  ]);
  if (!profile || !mentor) return null;
  return { profile, mentor };
}
