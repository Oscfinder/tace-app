import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Shared by the Finance page and the CSV export, so the export is always
// exactly the filtered table.
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const filterSchema = z.object({
  from: day.optional(),
  to: day.optional(),
  sponsor: z.string().uuid().optional(),
  project: z.string().uuid().optional(),
  receipt: z.enum(["sent", "pending"]).optional(),
});
export type FinanceFilters = z.infer<typeof filterSchema>;

// Anything invalid is dropped rather than trusted.
export function parseFinanceFilters(
  raw: Record<string, string | string[] | undefined>,
): FinanceFilters {
  const one = (k: string) => {
    const v = raw[k];
    const s = Array.isArray(v) ? v[0] : v;
    return s ? s : undefined;
  };
  const out: Record<string, string> = {};
  for (const key of ["from", "to", "sponsor", "project", "receipt"]) {
    const value = one(key);
    if (value && filterSchema.shape[key as keyof FinanceFilters].safeParse(value).success) {
      out[key] = value;
    }
  }
  return out as FinanceFilters;
}

export type FinanceRow = {
  id: string;
  created_at: string;
  donor_name: string;
  sponsor_name: string | null;
  project_title: string | null;
  child_name: string | null;
  amount: number;
  purpose: string | null;
  receipt_sent: boolean;
  has_email: boolean;
};

// Hard cap so one request can't pull an unbounded table into memory.
export const FINANCE_ROW_LIMIT = 5000;

export async function getFinanceRows(filters: FinanceFilters): Promise<{
  rows: FinanceRow[];
  total: number;
  truncated: boolean;
}> {
  const supabase = await createClient();
  let query = supabase
    .from("donations")
    .select(
      "id, created_at, donor_name, donor_email, sponsor_id, project_id, beneficiary_id, amount, purpose, receipt_sent",
    )
    .order("created_at", { ascending: false })
    .limit(FINANCE_ROW_LIMIT + 1);

  // Dates are whole days in Nigerian time (UTC+1).
  if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00+01:00`);
  if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59.999+01:00`);
  if (filters.sponsor) query = query.eq("sponsor_id", filters.sponsor);
  if (filters.project) query = query.eq("project_id", filters.project);
  if (filters.receipt) query = query.eq("receipt_sent", filters.receipt === "sent");

  const { data } = await query;
  const all = data ?? [];
  const truncated = all.length > FINANCE_ROW_LIMIT;
  const donations = truncated ? all.slice(0, FINANCE_ROW_LIMIT) : all;

  const ids = (key: "sponsor_id" | "project_id" | "beneficiary_id") => [
    ...new Set(donations.map((d) => d[key]).filter((v): v is string => !!v)),
  ];
  const sponsorIds = ids("sponsor_id");
  const projectIds = ids("project_id");
  const childIds = ids("beneficiary_id");

  const [{ data: sponsors }, { data: projects }, { data: children }] =
    await Promise.all([
      sponsorIds.length
        ? supabase.from("sponsors").select("id, profile_id").in("id", sponsorIds)
        : Promise.resolve({ data: [] }),
      projectIds.length
        ? supabase.from("projects").select("id, title").in("id", projectIds)
        : Promise.resolve({ data: [] }),
      childIds.length
        ? supabase.from("beneficiaries").select("id, first_name, last_name").in("id", childIds)
        : Promise.resolve({ data: [] }),
    ]);

  const profileIds = (sponsors ?? [])
    .map((s) => s.profile_id)
    .filter((v): v is string => !!v);
  const { data: profiles } = profileIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", profileIds)
    : { data: [] };
  const profileName = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  const sponsorName = new Map(
    (sponsors ?? []).map((s) => [s.id, s.profile_id ? profileName.get(s.profile_id) ?? "Sponsor" : "Sponsor"]),
  );
  const projectTitle = new Map((projects ?? []).map((p) => [p.id, p.title]));
  const childName = new Map((children ?? []).map((c) => [c.id, `${c.first_name} ${c.last_name}`]));

  const rows: FinanceRow[] = donations.map((d) => ({
    id: d.id,
    created_at: d.created_at,
    donor_name: d.donor_name,
    sponsor_name: d.sponsor_id ? sponsorName.get(d.sponsor_id) ?? null : null,
    project_title: d.project_id ? projectTitle.get(d.project_id) ?? null : null,
    child_name: d.beneficiary_id ? childName.get(d.beneficiary_id) ?? null : null,
    amount: Number(d.amount),
    purpose: d.purpose,
    receipt_sent: !!d.receipt_sent,
    has_email: !!d.donor_email,
  }));

  return { rows, total: rows.reduce((sum, r) => sum + r.amount, 0), truncated };
}

// Spreadsheet programs run text that starts with = + - @ as a formula, so a
// donor named "=HYPERLINK(...)" could attack whoever opens the export.
function csvCell(value: string | number | null): string {
  let text = value === null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function financeRowsToCsv(rows: FinanceRow[]): string {
  const header = ["Date", "Donor", "Sponsor", "Project", "Child", "Amount (NGN)", "Purpose", "Receipt"];
  const lines = rows.map((r) =>
    [
      r.created_at.slice(0, 10),
      r.donor_name,
      r.sponsor_name,
      r.project_title,
      r.child_name,
      r.amount.toFixed(2),
      r.purpose,
      r.receipt_sent ? "Sent" : "Not sent",
    ]
      .map(csvCell)
      .join(","),
  );
  return [header.map(csvCell).join(","), ...lines].join("\r\n");
}
