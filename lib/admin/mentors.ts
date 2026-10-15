import { createClient } from "@/lib/supabase/server";
import { calculateAge } from "@/lib/age";
import { getMentorLoads } from "@/lib/admin/matches-core";
import {
  MAX_ACTIVE_MENTEES,
  ageGroupFor,
  type VettingChecklist,
} from "@/lib/mentoring/constants";
import type { Database } from "@/types/database";

type MentorRow = Database["public"]["Tables"]["mentors"]["Row"];

export type MentorListRow = {
  id: string;
  full_name: string;
  email: string;
  profession: string | null;
  mentor_track: "career" | "tech" | null;
  vetting_status: MentorRow["vetting_status"];
  account_status: Database["public"]["Tables"]["profiles"]["Row"]["status"];
  activeMentees: number;
};

export async function getMentorList(): Promise<MentorListRow[]> {
  const supabase = await createClient();
  const { data: mentors } = await supabase
    .from("mentors")
    .select("id, profile_id, profession, mentor_track, vetting_status")
    .order("created_at", { ascending: false });
  const rows = (mentors ?? []).filter((m) => m.profile_id);
  if (rows.length === 0) return [];

  const [{ data: profiles }, { data: active }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, status")
      .in("id", rows.map((m) => m.profile_id!)),
    supabase.from("mentorship_matches").select("mentor_id").eq("status", "active"),
  ]);
  const byProfile = new Map((profiles ?? []).map((p) => [p.id, p]));
  const activeCount = new Map<string, number>();
  for (const a of active ?? []) {
    activeCount.set(a.mentor_id, (activeCount.get(a.mentor_id) ?? 0) + 1);
  }

  return rows.flatMap((m) => {
    const p = byProfile.get(m.profile_id!);
    if (!p) return [];
    return [
      {
        id: m.id,
        full_name: p.full_name,
        email: p.email,
        profession: m.profession,
        mentor_track: m.mentor_track,
        vetting_status: m.vetting_status,
        account_status: p.status,
        activeMentees: activeCount.get(m.id) ?? 0,
      },
    ];
  });
}

export type MentorMatchRow = {
  id: string;
  status: Database["public"]["Tables"]["mentorship_matches"]["Row"]["status"];
  beneficiaryId: string;
  childName: string;
  consentMentor: boolean;
  consentGuardian: boolean;
  startedAt: string | null;
  createdAt: string | null;
};

export type ChildCandidate = {
  id: string;
  name: string;
  age: number;
  suggested: boolean;
  reasons: string[];
};

export async function getMentorDetail(id: string) {
  const supabase = await createClient();
  const { data: mentor } = await supabase
    .from("mentors")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!mentor || !mentor.profile_id) return null;

  const [{ data: profile }, { data: vetter }, { data: matchRows }, loads] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, phone, status, created_at")
        .eq("id", mentor.profile_id)
        .single(),
      mentor.vetted_by
        ? supabase.from("profiles").select("full_name").eq("id", mentor.vetted_by).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("mentorship_matches")
        .select("id, status, beneficiary_id, consent_mentor, consent_guardian, started_at, created_at")
        .eq("mentor_id", id)
        .order("created_at", { ascending: false }),
      getMentorLoads(supabase),
    ]);
  if (!profile) return null;

  const childIds = [...new Set((matchRows ?? []).map((m) => m.beneficiary_id))];
  const { data: kids } = childIds.length
    ? await supabase
        .from("beneficiaries")
        .select("id, first_name, last_name")
        .in("id", childIds)
    : { data: [] as { id: string; first_name: string; last_name: string }[] };
  const nameById = new Map((kids ?? []).map((k) => [k.id, `${k.first_name} ${k.last_name}`]));

  const matches: MentorMatchRow[] = (matchRows ?? []).map((m) => ({
    id: m.id,
    status: m.status,
    beneficiaryId: m.beneficiary_id,
    childName: nameById.get(m.beneficiary_id) ?? "Unknown child",
    consentMentor: m.consent_mentor ?? false,
    consentGuardian: m.consent_guardian ?? false,
    startedAt: m.started_at,
    createdAt: m.created_at,
  }));

  // Children who could be matched to this mentor: no open match, suggested
  // first by age group and the track their career quiz recommended.
  const load = loads.get(id) ?? 0;
  const canMatch =
    mentor.vetting_status === "cleared" &&
    profile.status === "active" &&
    load < MAX_ACTIVE_MENTEES;

  let candidates: ChildCandidate[] = [];
  if (canMatch) {
    const [{ data: openMatches }, { data: children }, { data: assessments }] =
      await Promise.all([
        supabase
          .from("mentorship_matches")
          .select("beneficiary_id")
          .in("status", ["pending_consent", "active", "paused"]),
        supabase
          .from("beneficiaries")
          .select("id, first_name, last_name, date_of_birth")
          .eq("status", "active"),
        supabase
          .from("career_assessments")
          .select("beneficiary_id, recommended_mentor_track, created_at")
          .order("created_at", { ascending: false }),
      ]);
    const taken = new Set((openMatches ?? []).map((m) => m.beneficiary_id));
    const trackByChild = new Map<string, string | null>();
    for (const a of assessments ?? []) {
      if (!trackByChild.has(a.beneficiary_id)) {
        trackByChild.set(a.beneficiary_id, a.recommended_mentor_track);
      }
    }
    candidates = (children ?? [])
      .filter((c) => !taken.has(c.id))
      .map((c) => {
        const age = calculateAge(c.date_of_birth);
        const group = ageGroupFor(age);
        const reasons: string[] = [];
        if (group && mentor.preferred_age_group === group) {
          reasons.push(`Mentor prefers ages ${group}`);
        }
        const track = trackByChild.get(c.id);
        if (track && mentor.mentor_track === track) {
          reasons.push(`Career quiz recommends the ${track} track`);
        }
        const ageFits =
          !group ||
          !mentor.preferred_age_group ||
          mentor.preferred_age_group === "no_preference" ||
          mentor.preferred_age_group === group;
        return {
          id: c.id,
          name: `${c.first_name} ${c.last_name}`,
          age,
          suggested: ageFits && reasons.length > 0,
          reasons,
        };
      })
      .sort(
        (a, b) =>
          Number(b.suggested) - Number(a.suggested) ||
          b.reasons.length - a.reasons.length ||
          a.name.localeCompare(b.name),
      );
  }

  return {
    mentor,
    profile,
    vetterName: vetter?.full_name ?? null,
    checklist: (mentor.vetting_checklist ?? {}) as VettingChecklist,
    matches,
    load,
    canMatch,
    candidates,
  };
}
