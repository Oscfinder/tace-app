import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ConcernRow = Database["public"]["Tables"]["safeguarding_concerns"]["Row"];

export type ConcernItem = ConcernRow & {
  raisedByName: string;
  raisedByRole: string;
  childName: string;
  childId: string;
  mentorName: string | null;
};

export async function getConcerns(): Promise<ConcernItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("safeguarding_concerns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const raiserIds = [...new Set(rows.map((r) => r.raised_by))];
  const childIds = [...new Set(rows.map((r) => r.beneficiary_id))];
  const matchIds = [...new Set(rows.map((r) => r.match_id).filter((m): m is string => !!m))];

  const [{ data: raisers }, { data: kids }, { data: matches }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role").in("id", raiserIds),
    supabase.from("beneficiaries").select("id, first_name, last_name").in("id", childIds),
    matchIds.length
      ? supabase.from("mentorship_matches").select("id, mentor_id").in("id", matchIds)
      : Promise.resolve({ data: [] as { id: string; mentor_id: string }[] }),
  ]);

  // The mentor on the related match, if any, so the admin knows who is involved.
  const mentorIds = [...new Set((matches ?? []).map((m) => m.mentor_id))];
  const { data: mentors } = mentorIds.length
    ? await supabase.from("mentors").select("id, profile_id").in("id", mentorIds)
    : { data: [] as { id: string; profile_id: string | null }[] };
  const mentorProfileIds = (mentors ?? []).map((m) => m.profile_id).filter((p): p is string => !!p);
  const { data: mentorProfiles } = mentorProfileIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", mentorProfileIds)
    : { data: [] as { id: string; full_name: string }[] };

  const raiser = new Map((raisers ?? []).map((p) => [p.id, p]));
  const kid = new Map((kids ?? []).map((k) => [k.id, k]));
  const matchMentor = new Map((matches ?? []).map((m) => [m.id, m.mentor_id]));
  const mentorProfile = new Map((mentors ?? []).map((m) => [m.id, m.profile_id]));
  const profileName = new Map((mentorProfiles ?? []).map((p) => [p.id, p.full_name]));

  return rows.map((r) => {
    const mentorId = r.match_id ? matchMentor.get(r.match_id) : undefined;
    const mentorProfileId = mentorId ? mentorProfile.get(mentorId) : undefined;
    const k = kid.get(r.beneficiary_id);
    return {
      ...r,
      raisedByName: raiser.get(r.raised_by)?.full_name ?? "Unknown",
      raisedByRole: raiser.get(r.raised_by)?.role ?? "user",
      childName: k ? `${k.first_name} ${k.last_name}` : "Unknown child",
      childId: r.beneficiary_id,
      mentorName: mentorProfileId ? (profileName.get(mentorProfileId) ?? null) : null,
    };
  });
}

// Concerns that still need attention (open or being reviewed).
export async function getOpenConcernCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("safeguarding_concerns")
    .select("id", { count: "exact", head: true })
    .in("status", ["open", "reviewing"]);
  return count ?? 0;
}
