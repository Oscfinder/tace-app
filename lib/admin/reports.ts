import { createClient } from "@/lib/supabase/server";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/beneficiary-stages";

// Counts and sums only. Nothing here selects a name, email or any other
// personal field, so the report page and its printout can't leak one.

export const REPORT_MONTHS = 6;
export const APPLICATION_STATUSES = ["pending", "flagged", "approved", "rejected"] as const;

export type MonthBucket = { key: string; label: string };

export function lastMonths(count = REPORT_MONTHS, now = new Date()): MonthBucket[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-GB", { month: "short", year: "2-digit" }),
    };
  });
}

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export type ReportData = {
  months: MonthBucket[];
  applicationsByMonth: Record<string, Record<(typeof APPLICATION_STATUSES)[number], number>>;
  childrenByStage: { stage: string; label: string; count: number }[];
  totalChildren: number;
  activeMentors: number;
  activeMatches: number;
  donationsByMonth: { key: string; label: string; total: number; count: number }[];
  donationsTotal: number;
  sponsoredChildren: number;
  unsponsoredChildren: number;
  generatedAt: string;
};

export async function getReportData(): Promise<ReportData> {
  const supabase = await createClient();
  const months = lastMonths();
  const start = new Date(new Date().getFullYear(), new Date().getMonth() - (REPORT_MONTHS - 1), 1);

  const [
    { data: apps },
    { data: stages },
    { count: activeMentors },
    { count: activeMatches },
    { data: gifts },
    { count: sponsored },
    { count: unsponsored },
  ] = await Promise.all([
    supabase.from("applications").select("status, created_at").gte("created_at", start.toISOString()),
    supabase.from("beneficiaries").select("current_stage"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "mentor")
      .eq("status", "active"),
    supabase
      .from("mentorship_matches")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase.from("donations").select("amount, created_at").gte("created_at", start.toISOString()),
    supabase.from("beneficiaries").select("id", { count: "exact", head: true }).not("sponsor_id", "is", null),
    supabase.from("beneficiaries").select("id", { count: "exact", head: true }).is("sponsor_id", null),
  ]);

  const applicationsByMonth: ReportData["applicationsByMonth"] = {};
  for (const m of months) {
    applicationsByMonth[m.key] = { pending: 0, flagged: 0, approved: 0, rejected: 0 };
  }
  for (const a of apps ?? []) {
    const bucket = applicationsByMonth[monthKey(a.created_at)];
    const status = a.status as (typeof APPLICATION_STATUSES)[number];
    if (bucket && status in bucket) bucket[status] += 1;
  }

  const stageCounts = new Map<string, number>();
  for (const b of stages ?? []) {
    const s = b.current_stage ?? "identified";
    stageCounts.set(s, (stageCounts.get(s) ?? 0) + 1);
  }
  const childrenByStage = STAGE_ORDER.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    count: stageCounts.get(stage) ?? 0,
  }));

  const donationsByMonth = months.map((m) => ({ ...m, total: 0, count: 0 }));
  for (const g of gifts ?? []) {
    const bucket = donationsByMonth.find((m) => m.key === monthKey(g.created_at));
    if (bucket) {
      bucket.total += Number(g.amount);
      bucket.count += 1;
    }
  }

  return {
    months,
    applicationsByMonth,
    childrenByStage,
    totalChildren: (stages ?? []).length,
    activeMentors: activeMentors ?? 0,
    activeMatches: activeMatches ?? 0,
    donationsByMonth,
    donationsTotal: donationsByMonth.reduce((sum, m) => sum + m.total, 0),
    sponsoredChildren: sponsored ?? 0,
    unsponsoredChildren: unsponsored ?? 0,
    generatedAt: new Date().toISOString(),
  };
}
