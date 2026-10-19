import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Writes one audit_log row. It never throws: the action being recorded has
// already happened, so a logging failure must not make it look like it failed.
// `details` must hold ids, statuses and short reasons only, never personal data
// such as names, emails or message text.
export async function logAudit(
  supabase: SupabaseClient<Database>,
  userId: string,
  action: string,
  entityType: string,
  entityId?: string | null,
  details?: Record<string, string | number | boolean | null>,
) {
  const { error } = await supabase.from("audit_log").insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    details: details ?? null,
  });
  if (error) console.error("Audit log write failed:", action, error.message);
}
