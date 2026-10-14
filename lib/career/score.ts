import { z } from "zod";
import {
  CLUSTER_IDS,
  CLUSTERS,
  TIE_BREAK_ORDER,
  type ClusterId,
} from "@/lib/career/clusters";
import { MAX_TEXT_LENGTH, QUESTIONS } from "@/lib/career/questions";

// The quiz is for children aged 11 and over.
export const MIN_AGE = 11;
export const RETAKE_DAYS = 30;

export type Answers = Record<string, string | number>;

// ── Validation ───────────────────────────────────────────────────────────

// Strip control characters, collapse whitespace, cap length. The result is
// only ever passed on as quoted data.
export function sanitizeText(input: string): string {
  return input
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/[<>`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT_LENGTH);
}

const shape: Record<string, z.ZodTypeAny> = {};
for (const q of QUESTIONS) {
  if (q.type === "choice") shape[q.id] = z.enum(["a", "b"]);
  else if (q.type === "rating") shape[q.id] = z.number().int().min(1).max(5);
  else
    shape[q.id] = z
      .string()
      .max(MAX_TEXT_LENGTH, `Please keep this under ${MAX_TEXT_LENGTH} characters.`)
      .optional()
      .default("");
}

// Unknown keys are dropped (strict allow-list of question ids).
export const answersSchema = z.object(shape);

// ── Scoring (deterministic: no randomness, no AI) ───────────────────────

export type ScoreResult = {
  scores: Record<ClusterId, number>;
  /** Highest first. Ties are broken by TIE_BREAK_ORDER. */
  topClusters: [ClusterId, ClusterId];
  mentorTrack: "career" | "tech";
  maxScore: number;
};

const CHOICE_POINTS = 2;

/**
 * Highest score first. Equal scores are ordered by TIE_BREAK_ORDER
 * (Analytical, Builder, People & Care, Creative, Business) — never by chance.
 */
export function rankClusters(scores: Record<ClusterId, number>): ClusterId[] {
  return [...CLUSTER_IDS].sort(
    (x, y) =>
      scores[y] - scores[x] ||
      TIE_BREAK_ORDER.indexOf(x) - TIE_BREAK_ORDER.indexOf(y),
  );
}

export function scoreAnswers(answers: Answers): ScoreResult {
  const scores = Object.fromEntries(CLUSTER_IDS.map((c) => [c, 0])) as Record<ClusterId, number>;
  let maxPerCluster = 0;

  for (const q of QUESTIONS) {
    const value = answers[q.id];
    if (q.type === "choice") {
      if (value === "a") scores[q.a.cluster] += CHOICE_POINTS;
      else if (value === "b") scores[q.b.cluster] += CHOICE_POINTS;
    } else if (q.type === "rating" && typeof value === "number") {
      scores[q.cluster] += value;
    }
  }

  // Highest possible score for one cluster, for turning scores into %.
  for (const id of CLUSTER_IDS) {
    let max = 0;
    for (const q of QUESTIONS) {
      if (q.type === "choice" && (q.a.cluster === id || q.b.cluster === id)) max += CHOICE_POINTS;
      if (q.type === "rating" && q.cluster === id) max += 5;
    }
    maxPerCluster = Math.max(maxPerCluster, max);
  }

  const ranked = rankClusters(scores);
  const topClusters: [ClusterId, ClusterId] = [ranked[0], ranked[1]];

  return {
    scores,
    topClusters,
    mentorTrack: CLUSTERS[topClusters[0]].mentorTrack,
    maxScore: maxPerCluster,
  };
}

export function ageBracket(age: number): "11-13" | "14-17" | "18+" {
  if (age <= 13) return "11-13";
  if (age <= 17) return "14-17";
  return "18+";
}
