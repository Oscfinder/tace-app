"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { logAudit } from "@/lib/admin/audit";
import { eraseChild } from "@/lib/admin/data-requests";

type EraseResult =
  | { error: string; needsSafeguardingDecision?: boolean }
  | { success: true; taceId: string | null; counts: Record<string, number>; warnings: string[] };

const eraseSchema = z.object({
  beneficiaryId: z.string().uuid(),
  confirmTaceId: z.string().trim().min(1).max(40),
  includeSafeguarding: z.boolean(),
});

// Deletes everything about one child (a deletion request). Admin only, needs the
// child's TACE ID typed to confirm, and is written to the audit log: the entry
// holds the TACE ID and row counts, never names or contact details.
export async function eraseChildData(input: {
  beneficiaryId: string;
  confirmTaceId: string;
  includeSafeguarding: boolean;
}): Promise<EraseResult> {
  const session = await requireRole("admin");
  const parsed = eraseSchema.safeParse(input);
  if (!parsed.success) return { error: "Please type the child's TACE ID to confirm." };

  const outcome = await eraseChild(parsed.data);
  if (!outcome.ok) {
    return { error: outcome.error, needsSafeguardingDecision: outcome.needsSafeguardingDecision };
  }

  const supabase = await createClient();
  await logAudit(supabase, session.user.id, "beneficiary_data_erased", "beneficiary", parsed.data.beneficiaryId, {
    tace_id: outcome.taceId,
    safeguarding_records_deleted: parsed.data.includeSafeguarding,
    warnings: outcome.warnings.length,
    ...Object.fromEntries(Object.entries(outcome.counts).map(([k, v]) => [`removed_${k}`, v])),
  });

  revalidatePath("/dashboard/admin/beneficiaries");
  revalidatePath("/dashboard/admin");
  return { success: true, taceId: outcome.taceId, counts: outcome.counts, warnings: outcome.warnings };
}
