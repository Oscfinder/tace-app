import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Subject-access export and erasure for ONE child. Both are admin-only: the
// callers (a route handler and a Server Action) check the caller first.

const FILE_BUCKETS = ["beneficiary-photos", "certificates", "documents"] as const;

/**
 * Everything the foundation holds about one child, as a plain object that can be
 * handed to the child's family. Deliberately EXCLUDED:
 *  - safeguarding concerns (releasing them can put someone at risk and is a legal
 *    decision; the export says so);
 *  - other people's contact details (a donor's name and email, a mentor's phone).
 * Runs as the signed-in admin, so row-level security still applies.
 */
export async function buildChildExport(beneficiaryId: string) {
  const supabase = await createClient();
  const { data: child } = await supabase
    .from("beneficiaries")
    .select("*")
    .eq("id", beneficiaryId)
    .maybeSingle();
  if (!child) return null;

  const [
    { data: application },
    { data: progress },
    { data: support },
    { data: assessments },
    { data: thanks },
    { data: matches },
    { data: projects },
    { data: stories },
    { data: gifts },
  ] = await Promise.all([
    child.application_id
      ? supabase.from("applications").select("*").eq("id", child.application_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("progress_updates").select("title, content, created_at").eq("beneficiary_id", beneficiaryId),
    supabase.from("interventions").select("type, amount, description, notes, given_at, created_at").eq("beneficiary_id", beneficiaryId),
    supabase.from("career_assessments").select("*").eq("beneficiary_id", beneficiaryId),
    supabase.from("thank_you_messages").select("content, status, created_at").eq("beneficiary_id", beneficiaryId),
    supabase.from("mentorship_matches").select("id, status, started_at, ends_at, created_at").eq("beneficiary_id", beneficiaryId),
    supabase.from("project_beneficiaries").select("project_id, support_type, amount_needed").eq("beneficiary_id", beneficiaryId),
    supabase.from("stories").select("title, is_published, created_at").eq("beneficiary_id", beneficiaryId),
    supabase.from("donations").select("amount, purpose, created_at").eq("beneficiary_id", beneficiaryId),
  ]);

  const matchIds = (matches ?? []).map((m) => m.id);
  const [{ data: messages }, { data: notes }] = matchIds.length
    ? await Promise.all([
        supabase
          .from("mentorship_messages")
          .select("match_id, sender_type, content, is_flagged, created_at")
          .in("match_id", matchIds)
          .order("created_at"),
        supabase
          .from("mentorship_notes")
          .select("match_id, topics_discussed, improvements, concerns, next_steps, check_in_date, created_at")
          .in("match_id", matchIds),
      ])
    : [{ data: [] }, { data: [] }];

  // Files, with links that stop working after one hour.
  const files: { bucket: string; name: string; download_link_valid_for_one_hour: string | null }[] = [];
  for (const bucket of FILE_BUCKETS) {
    const { data: list } = await supabase.storage.from(bucket).list(beneficiaryId);
    for (const f of list ?? []) {
      if (!f.name) continue;
      const path = `${beneficiaryId}/${f.name}`;
      const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
      files.push({ bucket, name: path, download_link_valid_for_one_hour: signed?.signedUrl ?? null });
    }
  }

  return {
    exported_at: new Date().toISOString(),
    note:
      "Safeguarding concerns are not included in this export. Whether they can be released is a legal question: ask the foundation's legal trustee. " +
      "Donor and mentor contact details are not included either.",
    child,
    application,
    progress_updates: progress ?? [],
    support_received: support ?? [],
    career_assessments: assessments ?? [],
    thank_you_messages: thanks ?? [],
    mentor_matches: matches ?? [],
    mentor_messages: messages ?? [],
    mentor_notes: notes ?? [],
    projects: projects ?? [],
    stories_about_child: stories ?? [],
    gifts_for_child: gifts ?? [],
    files,
  };
}

export type EraseOutcome =
  | { ok: true; taceId: string | null; counts: Record<string, number>; warnings: string[] }
  | { ok: false; error: string; needsSafeguardingDecision?: boolean };

async function removeFolder(
  admin: ReturnType<typeof createAdminClient>,
  bucket: string,
  folder: string,
  warnings: string[],
) {
  const { data: list, error } = await admin.storage.from(bucket).list(folder, { limit: 1000 });
  if (error) {
    warnings.push(`Could not list ${bucket}/${folder}`);
    return;
  }
  const paths = (list ?? []).filter((f) => f.name).map((f) => `${folder}/${f.name}`);
  if (paths.length === 0) return;
  const { error: removeError } = await admin.storage.from(bucket).remove(paths);
  if (removeError) warnings.push(`Could not remove ${paths.length} file(s) from ${bucket}/${folder}`);
}

/**
 * Deletes one child's data. The database part is a single transaction (the
 * `erase_beneficiary_records` function, migration 016); the files and the
 * sign-in account are removed afterwards. If one of those later steps fails the
 * records are already gone, so it is reported as a warning to finish by hand.
 * Uses the service role: only call it from an admin Server Action.
 */
export async function eraseChild(input: {
  beneficiaryId: string;
  confirmTaceId: string;
  includeSafeguarding: boolean;
}): Promise<EraseOutcome> {
  const supabase = await createClient();
  const { data: child } = await supabase
    .from("beneficiaries")
    .select("id, tace_id, profile_id, application_id")
    .eq("id", input.beneficiaryId)
    .maybeSingle();
  if (!child) return { ok: false, error: "That child was not found." };
  if ((child.tace_id ?? "").trim().toLowerCase() !== input.confirmTaceId.trim().toLowerCase()) {
    return { ok: false, error: "The TACE ID you typed does not match. Nothing was deleted." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("erase_beneficiary_records", {
    p_beneficiary_id: child.id,
    p_include_safeguarding: input.includeSafeguarding,
  });
  if (error) {
    if (/safeguarding_records_exist/.test(error.message)) {
      return {
        ok: false,
        needsSafeguardingDecision: true,
        error:
          "This child has safeguarding records. They are not deleted unless you choose to. Ask the legal trustee whether they must be kept, then tick the box to delete them too.",
      };
    }
    console.error("erase_beneficiary_records failed:", error.message);
    return { ok: false, error: "The deletion failed and nothing was removed. Please try again." };
  }

  const result = data as { counts?: Record<string, number> } | null;
  const warnings: string[] = [];
  for (const bucket of FILE_BUCKETS) await removeFolder(admin, bucket, child.id, warnings);
  if (child.application_id) await removeFolder(admin, "beneficiary-photos", `applications/${child.application_id}`, warnings);
  if (child.profile_id) {
    await removeFolder(admin, "avatars", child.profile_id, warnings);
    const { error: authError } = await admin.auth.admin.deleteUser(child.profile_id);
    if (authError) warnings.push("Could not delete the child's sign-in account: delete it in Supabase, Authentication, Users.");
  }
  return { ok: true, taceId: child.tace_id, counts: result?.counts ?? {}, warnings };
}
