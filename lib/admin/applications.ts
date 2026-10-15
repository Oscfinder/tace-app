import { createClient } from "@/lib/supabase/server";
import { getMentorLoads } from "@/lib/admin/matches-core";
import { MAX_ACTIVE_MENTEES, ageGroupFor } from "@/lib/mentoring/constants";
import type { Database } from "@/types/database";

export type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];

export async function getApplications(): Promise<ApplicationRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getApplication(
  id: string,
): Promise<ApplicationRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export type AssignableMentor = {
  id: string;
  full_name: string;
  profession: string | null;
  mentor_track: string | null;
  preferred_age_group: string | null;
  /** Mentees this mentor already has or has been asked to take. */
  load: number;
  /** True when this mentor fits the child on age group and/or track. */
  suggested: boolean;
  /** Plain-language reasons shown next to a suggestion. */
  reasons: string[];
};

export type ChildForMatching = {
  age: number;
  /** career_assessments.recommended_mentor_track, if the child took the quiz. */
  recommendedTrack: "career" | "tech" | null;
};

/**
 * Mentors an admin may match: cleared by vetting, active account, and under
 * the mentee cap. When `child` is given, mentors are ranked by fit:
 * same preferred age group (or no preference) and the track the child's
 * career quiz recommended.
 */
export async function getAssignableMentors(
  child?: ChildForMatching,
): Promise<AssignableMentor[]> {
  const supabase = await createClient();

  const { data: mentorRows } = await supabase
    .from("mentors")
    .select("id, profile_id, profession, mentor_track, preferred_age_group")
    // Only mentors cleared by vetting can be matched (also enforced in the DB).
    .eq("vetting_status", "cleared");
  const mentors = (mentorRows ?? []).filter(
    (m): m is typeof m & { profile_id: string } => Boolean(m.profile_id),
  );
  if (mentors.length === 0) return [];

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, full_name, status")
    .in(
      "id",
      mentors.map((m) => m.profile_id),
    )
    .eq("status", "active");

  const activeProfiles = new Map(
    (profileRows ?? []).map((p) => [p.id, p.full_name]),
  );
  const loads = await getMentorLoads(supabase);
  const childGroup = child ? ageGroupFor(child.age) : null;

  const list = mentors
    .filter((m) => activeProfiles.has(m.profile_id))
    .filter((m) => (loads.get(m.id) ?? 0) < MAX_ACTIVE_MENTEES)
    .map((m) => {
      const reasons: string[] = [];
      if (child) {
        const pref = m.preferred_age_group;
        if (childGroup && pref === childGroup) {
          reasons.push(`Prefers ages ${childGroup}`);
        }
        if (child.recommendedTrack && m.mentor_track === child.recommendedTrack) {
          reasons.push(
            `${child.recommendedTrack === "tech" ? "Tech" : "Career"} track (matches the career quiz)`,
          );
        }
      }
      const ageFits =
        !child ||
        !childGroup ||
        m.preferred_age_group === childGroup ||
        m.preferred_age_group === "no_preference" ||
        !m.preferred_age_group;
      return {
        id: m.id,
        full_name: activeProfiles.get(m.profile_id)!,
        profession: m.profession,
        mentor_track: m.mentor_track,
        preferred_age_group: m.preferred_age_group,
        load: loads.get(m.id) ?? 0,
        suggested: !!child && ageFits && reasons.length > 0,
        reasons,
      };
    });

  // Suggested first, then the least-loaded, then by name.
  return list.sort(
    (a, b) =>
      Number(b.suggested) - Number(a.suggested) ||
      b.reasons.length - a.reasons.length ||
      a.load - b.load ||
      a.full_name.localeCompare(b.full_name),
  );
}
