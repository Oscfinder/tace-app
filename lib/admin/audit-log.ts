import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const filterSchema = z.object({
  user: z.string().uuid().optional(),
  action: z.string().regex(/^[a-z_]{1,60}$/).optional(),
  from: day.optional(),
  to: day.optional(),
  page: z.coerce.number().int().min(1).max(10000).optional(),
});
export type AuditFilters = z.infer<typeof filterSchema>;

export const AUDIT_PAGE_SIZE = 50;

export function parseAuditFilters(
  raw: Record<string, string | string[] | undefined>,
): AuditFilters {
  const out: Record<string, string> = {};
  for (const key of ["user", "action", "from", "to", "page"]) {
    const v = raw[key];
    const s = Array.isArray(v) ? v[0] : v;
    if (s && filterSchema.shape[key as keyof AuditFilters].safeParse(s).success) out[key] = s;
  }
  return filterSchema.parse(out);
}

export type AuditRow = {
  id: string;
  created_at: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  user_name: string;
};

export async function getAuditLog(filters: AuditFilters) {
  const supabase = await createClient();
  const page = filters.page ?? 1;
  let query = supabase
    .from("audit_log")
    .select("id, created_at, action, entity_type, entity_id, details, user_id", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range((page - 1) * AUDIT_PAGE_SIZE, page * AUDIT_PAGE_SIZE - 1);
  if (filters.user) query = query.eq("user_id", filters.user);
  if (filters.action) query = query.eq("action", filters.action);
  if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00+01:00`);
  if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59.999+01:00`);

  const { data, count } = await query;
  const rows = data ?? [];
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] };
  const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return {
    rows: rows.map(
      (r): AuditRow => ({
        id: r.id,
        created_at: r.created_at,
        action: r.action,
        entity_type: r.entity_type,
        entity_id: r.entity_id,
        details: r.details,
        user_name: names.get(r.user_id) ?? "Unknown",
      }),
    ),
    total: count ?? 0,
    page,
  };
}

// For the filter dropdowns: who has acted, and which actions exist.
export async function getAuditFilterOptions() {
  const supabase = await createClient();
  const [{ data: admins }, { data: actions }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("role", "admin").order("full_name"),
    supabase.from("audit_log").select("action").order("created_at", { ascending: false }).limit(1000),
  ]);
  return {
    users: admins ?? [],
    actions: [...new Set((actions ?? []).map((a) => a.action))].sort(),
  };
}
