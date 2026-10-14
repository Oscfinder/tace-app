import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectBeneficiaryRow =
  Database["public"]["Tables"]["project_beneficiaries"]["Row"];

export async function getProjects(): Promise<ProjectRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getProject(id: string): Promise<ProjectRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}

// Computed live from the donations table rather than trusting
// projects.current_amount, which nothing keeps in sync — same reasoning as
// the Ticket 2E fix to sponsors.total_donated: a stored running total is
// one more place for read-then-write drift, a SUM query never drifts.
export async function getProjectDonationTotal(
  projectId: string,
): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("donations")
    .select("amount")
    .eq("project_id", projectId);
  return (data ?? []).reduce((sum, d) => sum + Number(d.amount), 0);
}

export async function getProjectDonations(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("donations")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export type AttachedBeneficiary = ProjectBeneficiaryRow & {
  first_name: string;
  last_name: string;
};

export async function getAttachedBeneficiaries(
  projectId: string,
): Promise<AttachedBeneficiary[]> {
  const supabase = await createClient();
  const { data: links } = await supabase
    .from("project_beneficiaries")
    .select("*")
    .eq("project_id", projectId);
  const rows = links ?? [];
  if (rows.length === 0) return [];

  const { data: beneficiaries } = await supabase
    .from("beneficiaries")
    .select("id, first_name, last_name")
    .in(
      "id",
      rows.map((r) => r.beneficiary_id),
    );
  const nameById = new Map((beneficiaries ?? []).map((b) => [b.id, b]));

  return rows.map((r) => ({
    ...r,
    first_name: nameById.get(r.beneficiary_id)?.first_name ?? "Unknown",
    last_name: nameById.get(r.beneficiary_id)?.last_name ?? "",
  }));
}

export type BeneficiaryPickerOption = {
  id: string;
  first_name: string;
  last_name: string;
};

export async function getUnattachedBeneficiaries(
  projectId: string,
): Promise<BeneficiaryPickerOption[]> {
  const supabase = await createClient();
  const { data: links } = await supabase
    .from("project_beneficiaries")
    .select("beneficiary_id")
    .eq("project_id", projectId);
  const attachedIds = new Set((links ?? []).map((l) => l.beneficiary_id));

  const { data: beneficiaries } = await supabase
    .from("beneficiaries")
    .select("id, first_name, last_name")
    .order("first_name");

  return (beneficiaries ?? []).filter((b) => !attachedIds.has(b.id));
}

/** Names of attached beneficiaries whose original application doesn't have
 * consent_photography=true — the public_beneficiaries view already hides
 * these, but admins should know *before* publishing, not be left wondering
 * why a child silently doesn't show up. */
export async function getConsentWarnings(projectId: string): Promise<string[]> {
  const supabase = await createClient();

  const { data: links } = await supabase
    .from("project_beneficiaries")
    .select("beneficiary_id")
    .eq("project_id", projectId);
  const beneficiaryIds = (links ?? []).map((l) => l.beneficiary_id);
  if (beneficiaryIds.length === 0) return [];

  const { data: beneficiaries } = await supabase
    .from("beneficiaries")
    .select("id, first_name, last_name, application_id")
    .in("id", beneficiaryIds);
  const rows = beneficiaries ?? [];

  const applicationIds = rows
    .map((b) => b.application_id)
    .filter((id): id is string => Boolean(id));

  const consentByApplication = new Map<string, boolean>();
  if (applicationIds.length > 0) {
    const { data: applications } = await supabase
      .from("applications")
      .select("id, consent_photography")
      .in("id", applicationIds);
    for (const a of applications ?? []) {
      consentByApplication.set(a.id, a.consent_photography);
    }
  }

  return rows
    .filter((b) => {
      const consented = b.application_id
        ? (consentByApplication.get(b.application_id) ?? false)
        : false;
      return !consented;
    })
    .map((b) => `${b.first_name} ${b.last_name}`);
}
