"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { getConsentWarnings } from "@/lib/admin/projects";

type ActionResult = { error: string } | { success: true };

export async function createProject(input: {
  title: string;
  description: string | null;
  targetAmount: number | null;
  startDate: string | null;
  endDate: string | null;
}): Promise<ActionResult | never> {
  const session = await requireRole("admin");
  if (!input.title.trim()) return { error: "Title is required." };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      title: input.title,
      description: input.description,
      target_amount: input.targetAmount,
      start_date: input.startDate,
      end_date: input.endDate,
      status: "draft",
      is_published: false,
      created_by: session.user.id,
    })
    .select("id")
    .single();

  if (error || !data)
    return { error: error?.message ?? "Could not create project." };

  revalidatePath("/dashboard/admin/projects");
  redirect(`/dashboard/admin/projects/${data.id}`);
}

export async function attachBeneficiary(input: {
  projectId: string;
  beneficiaryId: string;
  supportType: string | null;
  amountNeeded: number | null;
}): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase.from("project_beneficiaries").insert({
    project_id: input.projectId,
    beneficiary_id: input.beneficiaryId,
    support_type: input.supportType,
    amount_needed: input.amountNeeded,
  });
  if (error) {
    return {
      error:
        error.code === "23505"
          ? "That child is already attached to this project."
          : error.message,
    };
  }

  revalidatePath(`/dashboard/admin/projects/${input.projectId}`);
  return { success: true };
}

export async function detachBeneficiary(
  projectBeneficiaryId: string,
  projectId: string,
): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("project_beneficiaries")
    .delete()
    .eq("id", projectBeneficiaryId);
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/admin/projects/${projectId}`);
  return { success: true };
}

export async function publishProject(input: {
  projectId: string;
  confirmedDespiteWarnings: boolean;
}): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  // Re-derived server-side, same as the consent check the UI already ran —
  // never trust the client's own read of who has consent.
  const warnings = await getConsentWarnings(input.projectId);
  if (warnings.length > 0 && !input.confirmedDespiteWarnings) {
    return {
      error: `${warnings.join(", ")} ${warnings.length === 1 ? "doesn't" : "don't"} have photography consent and won't appear publicly even once this project is published. Confirm to publish anyway.`,
    };
  }

  const { error } = await supabase
    .from("projects")
    .update({ is_published: true, status: "active" })
    .eq("id", input.projectId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/projects");
  revalidatePath(`/dashboard/admin/projects/${input.projectId}`);
  revalidatePath("/");
  return { success: true };
}

export async function unpublishProject(
  projectId: string,
): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .update({ is_published: false })
    .eq("id", projectId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/projects");
  revalidatePath(`/dashboard/admin/projects/${projectId}`);
  revalidatePath("/");
  return { success: true };
}

export async function archiveProject(projectId: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  // Belt-and-suspenders alongside the RLS fix: archived projects must never
  // be publicly visible, so force is_published=false here too rather than
  // relying solely on the database policy to hide a still-"published" row.
  const { error } = await supabase
    .from("projects")
    .update({ status: "archived", is_published: false })
    .eq("id", projectId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/projects");
  revalidatePath(`/dashboard/admin/projects/${projectId}`);
  revalidatePath("/");
  return { success: true };
}
