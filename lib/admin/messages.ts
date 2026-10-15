import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type MessageRow = Database["public"]["Tables"]["mentorship_messages"]["Row"];

export type ThreadSummary = {
  matchId: string;
  status: string;
  mentorName: string;
  childName: string;
  childId: string;
  total: number;
  flagged: number;
  lastAt: string | null;
};

async function namesForMatches(
  supabase: Awaited<ReturnType<typeof createClient>>,
  matchIds: string[],
) {
  if (matchIds.length === 0) return new Map<string, Omit<ThreadSummary, "total" | "flagged" | "lastAt">>();
  const { data: matches } = await supabase
    .from("mentorship_matches")
    .select("id, status, mentor_id, beneficiary_id")
    .in("id", matchIds);
  const rows = matches ?? [];
  const mentorIds = [...new Set(rows.map((m) => m.mentor_id))];
  const childIds = [...new Set(rows.map((m) => m.beneficiary_id))];

  const [{ data: mentors }, { data: kids }] = await Promise.all([
    supabase.from("mentors").select("id, profile_id").in("id", mentorIds),
    supabase.from("beneficiaries").select("id, first_name, last_name").in("id", childIds),
  ]);
  const profileIds = (mentors ?? []).map((m) => m.profile_id).filter((p): p is string => !!p);
  const { data: profiles } = profileIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", profileIds)
    : { data: [] as { id: string; full_name: string }[] };

  const profileName = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  const mentorName = new Map(
    (mentors ?? []).map((m) => [m.id, m.profile_id ? (profileName.get(m.profile_id) ?? "Unknown mentor") : "Unknown mentor"]),
  );
  const kid = new Map((kids ?? []).map((k) => [k.id, `${k.first_name} ${k.last_name}`]));

  return new Map(
    rows.map((m) => [
      m.id,
      {
        matchId: m.id,
        status: m.status ?? "pending_consent",
        mentorName: mentorName.get(m.mentor_id) ?? "Unknown mentor",
        childName: kid.get(m.beneficiary_id) ?? "Unknown child",
        childId: m.beneficiary_id,
      },
    ]),
  );
}

// Every conversation that has messages, plus active mentorships with none yet.
export async function getThreads(): Promise<ThreadSummary[]> {
  const supabase = await createClient();
  const [{ data: msgs }, { data: active }] = await Promise.all([
    supabase
      .from("mentorship_messages")
      .select("match_id, is_flagged, created_at")
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase.from("mentorship_matches").select("id").eq("status", "active"),
  ]);

  const agg = new Map<string, { total: number; flagged: number; lastAt: string | null }>();
  for (const m of msgs ?? []) {
    const a = agg.get(m.match_id) ?? { total: 0, flagged: 0, lastAt: null };
    a.total++;
    if (m.is_flagged) a.flagged++;
    if (!a.lastAt) a.lastAt = m.created_at; // newest first
    agg.set(m.match_id, a);
  }
  for (const a of active ?? []) {
    if (!agg.has(a.id)) agg.set(a.id, { total: 0, flagged: 0, lastAt: null });
  }

  const names = await namesForMatches(supabase, [...agg.keys()]);
  const out: ThreadSummary[] = [];
  for (const [id, a] of agg) {
    const n = names.get(id);
    if (n) out.push({ ...n, ...a });
  }
  // Threads with flagged messages first, then most recent.
  return out.sort(
    (x, y) =>
      Number(y.flagged > 0) - Number(x.flagged > 0) ||
      new Date(y.lastAt ?? 0).getTime() - new Date(x.lastAt ?? 0).getTime(),
  );
}

export type FlaggedItem = MessageRow & { mentorName: string; childName: string };

export async function getFlaggedMessages(): Promise<FlaggedItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mentorship_messages")
    .select("*")
    .eq("is_flagged", true)
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = data ?? [];
  const names = await namesForMatches(supabase, [...new Set(rows.map((r) => r.match_id))]);
  return rows.map((r) => ({
    ...r,
    mentorName: names.get(r.match_id)?.mentorName ?? "Unknown mentor",
    childName: names.get(r.match_id)?.childName ?? "Unknown child",
  }));
}

export async function getFlaggedMessageCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("mentorship_messages")
    .select("id", { count: "exact", head: true })
    .eq("is_flagged", true);
  return count ?? 0;
}

export async function getTranscript(matchId: string) {
  const supabase = await createClient();
  const names = await namesForMatches(supabase, [matchId]);
  const summary = names.get(matchId);
  if (!summary) return null;
  const { data } = await supabase
    .from("mentorship_messages")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });
  return { summary, messages: data ?? [] };
}
