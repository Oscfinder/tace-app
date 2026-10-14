"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { STAGE_LABELS } from "@/lib/beneficiary-stages";
import type { Database } from "@/types/database";

type ActionResult = { error: string } | { success: true };
type Stage =
  Database["public"]["Tables"]["beneficiaries"]["Row"]["current_stage"];

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export async function updateBeneficiaryStage(input: {
  beneficiaryId: string;
  newStage: Stage;
  note: string;
}): Promise<ActionResult> {
  const session = await requireRole("admin");
  if (!input.note.trim()) {
    return { error: "A short note is required when moving a stage." };
  }
  const supabase = await createClient();

  const { error: progressError } = await supabase
    .from("progress_updates")
    .insert({
      beneficiary_id: input.beneficiaryId,
      title: `Stage updated to ${STAGE_LABELS[input.newStage] ?? input.newStage}`,
      content: input.note,
      posted_by: session.user.id,
    });
  if (progressError) return { error: progressError.message };

  const { error: updateError } = await supabase
    .from("beneficiaries")
    .update({
      current_stage: input.newStage,
      stage_updated_at: new Date().toISOString(),
    })
    .eq("id", input.beneficiaryId);
  if (updateError) return { error: updateError.message };

  // Celebrate with the child (or their guardian, who shares the login).
  // Best-effort: the stage change has already succeeded, so a failed
  // notification must not make it look like it failed.
  const { data: child } = await supabase
    .from("beneficiaries")
    .select("profile_id, first_name")
    .eq("id", input.beneficiaryId)
    .maybeSingle();
  if (child?.profile_id) {
    const { error: notifyError } = await supabase.from("notifications").insert({
      profile_id: child.profile_id,
      title: `Congratulations, ${child.first_name}! 🎉`,
      body: `You've reached a new step: ${STAGE_LABELS[input.newStage] ?? input.newStage}. We're so proud of you!`,
      type: "stage_change",
    });
    if (notifyError) {
      console.error("Stage-change notification failed:", notifyError.message);
    }
  }

  revalidatePath(`/dashboard/admin/beneficiaries/${input.beneficiaryId}`);
  revalidatePath("/dashboard/admin/beneficiaries");
  return { success: true };
}

export async function assignMentor(input: {
  beneficiaryId: string;
  mentorId: string;
}): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("mentorship_matches")
    .select("id")
    .eq("beneficiary_id", input.beneficiaryId)
    .in("status", ["pending_consent", "active"])
    .maybeSingle();
  if (existing) {
    return {
      error: "This beneficiary already has a pending or active mentor match.",
    };
  }

  // Pending-consent only — beneficiaries.mentor_id is set once the Phase 4
  // consent flow completes, never directly from this assignment step.
  const { error } = await supabase.from("mentorship_matches").insert({
    beneficiary_id: input.beneficiaryId,
    mentor_id: input.mentorId,
    status: "pending_consent",
  });
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/admin/beneficiaries/${input.beneficiaryId}`);
  return { success: true };
}

export async function logIntervention(input: {
  beneficiaryId: string;
  type: string;
  amount: number | null;
  description: string;
  date: string;
}): Promise<ActionResult> {
  const session = await requireRole("admin");
  if (!input.type.trim()) return { error: "Type is required." };
  const supabase = await createClient();

  const { error } = await supabase.from("interventions").insert({
    beneficiary_id: input.beneficiaryId,
    type: input.type,
    amount: input.amount,
    description: input.description || null,
    given_by: session.user.id,
    given_at: input.date,
  });
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/admin/beneficiaries/${input.beneficiaryId}`);
  return { success: true };
}

export async function uploadBeneficiaryDocument(
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("admin");

  const beneficiaryId = formData.get("beneficiaryId");
  const bucket = formData.get("bucket");
  const file = formData.get("file");

  if (typeof beneficiaryId !== "string" || !beneficiaryId) {
    return { error: "Missing beneficiary." };
  }
  if (bucket !== "documents" && bucket !== "certificates") {
    return { error: "Invalid destination bucket." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file selected." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Only JPG, PNG, or PDF files are allowed." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "File is larger than the 5MB limit." };
  }

  const supabase = await createClient();
  const path = `${beneficiaryId}/${file.name}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/admin/beneficiaries/${beneficiaryId}`);
  return { success: true };
}
