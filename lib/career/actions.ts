"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { calculateAge } from "@/lib/age";
import { type ClusterId } from "@/lib/career/clusters";
import { generateCareerNarrative } from "@/lib/career/ai";
import {
  MIN_AGE,
  RETAKE_DAYS,
  ageBracket,
  answersSchema,
  sanitizeText,
  scoreAnswers,
} from "@/lib/career/score";

const DAY_MS = 24 * 60 * 60 * 1000;

export type AssessmentResult = {
  topClusters: [ClusterId, ClusterId];
  scores: Record<ClusterId, number>;
  maxScore: number;
  narrative: string | null;
  mentorTrack: "career" | "tech";
};

type Result = { error: string } | { success: true; result: AssessmentResult };

export async function submitAssessment(input: unknown): Promise<Result> {
  const session = await requireRole("beneficiary");
  const supabase = await createClient();

  // 1. Who is this, and are they old enough?
  const { data: child } = await supabase
    .from("beneficiaries")
    .select("id, date_of_birth, first_name, last_name, school_name")
    .eq("profile_id", session.user.id)
    .maybeSingle();
  if (!child) return { error: "We couldn't find your profile. Please try again." };
  const age = calculateAge(child.date_of_birth);
  if (age < MIN_AGE) {
    return { error: "This quiz is for children aged 11 and over." };
  }

  // 2. Retake limit — one new assessment per 30 days, enforced here.
  const { data: latest } = await supabase
    .from("career_assessments")
    .select("created_at")
    .eq("beneficiary_id", child.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest?.created_at) {
    const nextAt = new Date(new Date(latest.created_at).getTime() + RETAKE_DAYS * DAY_MS);
    if (nextAt.getTime() > Date.now()) {
      return {
        error: `You've already taken the quiz recently. You can take it again on ${nextAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`,
      };
    }
  }

  // 3. Validate the answers (open text max 300 characters, unknown keys dropped).
  const parsed = answersSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please answer every question." };
  }
  const answers = parsed.data as Record<string, string | number>;
  for (const key of Object.keys(answers)) {
    if (typeof answers[key] === "string" && !["a", "b"].includes(answers[key] as string)) {
      answers[key] = sanitizeText(answers[key] as string);
    }
  }

  // 4. Deterministic scoring — the AI never decides the clusters.
  const score = scoreAnswers(answers);

  // 5. One AI call for the narrative. Never throws; null = show the static result.
  const reflections = Object.entries(answers)
    .filter(([k, v]) => k.startsWith("t") && typeof v === "string" && v !== "")
    .map(([, v]) => v as string);
  const narrative = await generateCareerNarrative({
    ageBracket: ageBracket(age),
    topClusters: score.topClusters.map((id) => ({
      id,
      percent: Math.round((score.scores[id] / score.maxScore) * 100),
    })),
    reflections,
    // Never let the child's own names or school reach the AI provider.
    personalTerms: [child.first_name, child.last_name, child.school_name],
  });

  // 6. Save (RLS: a beneficiary may insert only for themselves).
  const { error: insertError } = await supabase.from("career_assessments").insert({
    beneficiary_id: child.id,
    answers,
    scores: score.scores,
    top_clusters: score.topClusters,
    ai_narrative: narrative,
    recommended_mentor_track: score.mentorTrack,
  });
  if (insertError) {
    console.error("career_assessments insert failed:", insertError.message);
    return { error: "We couldn't save your result. Please try again in a moment." };
  }

  revalidatePath("/dashboard/beneficiary/discover");
  return {
    success: true,
    result: {
      topClusters: score.topClusters,
      scores: score.scores,
      maxScore: score.maxScore,
      narrative,
      mentorTrack: score.mentorTrack,
    },
  };
}
