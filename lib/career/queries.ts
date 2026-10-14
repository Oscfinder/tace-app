import { createClient } from "@/lib/supabase/server";
import { CLUSTER_IDS, type ClusterId } from "@/lib/career/clusters";
import { RETAKE_DAYS } from "@/lib/career/score";
import type { Database } from "@/types/database";

export type AssessmentRow =
  Database["public"]["Tables"]["career_assessments"]["Row"];

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getAssessments(
  beneficiaryId: string,
): Promise<AssessmentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("career_assessments")
    .select("*")
    .eq("beneficiary_id", beneficiaryId)
    .order("created_at", { ascending: false })
    .limit(10);
  return data ?? [];
}

export function nextAvailable(latest: AssessmentRow | undefined): Date | null {
  if (!latest?.created_at) return null;
  const next = new Date(new Date(latest.created_at).getTime() + RETAKE_DAYS * DAY_MS);
  return next.getTime() > Date.now() ? next : null;
}

// Narrow stored text[] back to two known cluster ids (or null if malformed).
export function topTwo(ids: string[] | null): [ClusterId, ClusterId] | null {
  const valid = (ids ?? []).filter((id): id is ClusterId =>
    (CLUSTER_IDS as readonly string[]).includes(id),
  );
  return valid.length >= 2 ? [valid[0], valid[1]] : null;
}

// The max score for one cluster, derived from the stored scores so old
// results keep rendering correctly even if the question set changes.
export function maxFrom(scores: Record<string, number> | null): number {
  const values = Object.values(scores ?? {});
  return Math.max(13, ...values);
}
