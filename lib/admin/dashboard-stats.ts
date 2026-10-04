import { createClient } from "@/lib/supabase/server";

export type AdminDashboardStats = {
  totalBeneficiaries: number;
  activeSponsors: number;
  pendingApplications: number;
  totalDonations: number;
  activeMentors: number;
  activeMembers: number;
};

export async function getPendingApplicationsCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}

export type MonthlyCount = { month: string; count: number };

export async function getBeneficiaryGrowth(
  months = 6,
): Promise<MonthlyCount[]> {
  const supabase = await createClient();

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const { data } = await supabase
    .from("beneficiaries")
    .select("created_at")
    .gte("created_at", start.toISOString());

  const buckets: MonthlyCount[] = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    return { month: d.toLocaleString("en-US", { month: "short" }), count: 0 };
  });

  for (const row of data ?? []) {
    const created = new Date(row.created_at);
    const diff =
      (now.getFullYear() - created.getFullYear()) * 12 +
      (now.getMonth() - created.getMonth());
    const index = months - 1 - diff;
    if (index >= 0 && index < months) buckets[index].count += 1;
  }

  return buckets;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = await createClient();

  const [
    { count: totalBeneficiaries },
    { count: activeSponsors },
    { count: pendingApplications },
    { data: donationRows },
    { data: mentorRows },
    { count: activeMembers },
  ] = await Promise.all([
    supabase.from("beneficiaries").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "sponsor")
      .eq("status", "active"),
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("donations").select("amount"),
    supabase.from("mentors").select("profile_id"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "member")
      .eq("status", "active"),
  ]);

  const totalDonations = (donationRows ?? []).reduce(
    (sum, row) => sum + Number(row.amount),
    0,
  );

  const mentorProfileIds = (mentorRows ?? [])
    .map((row) => row.profile_id)
    .filter((id): id is string => Boolean(id));

  let activeMentors = 0;
  if (mentorProfileIds.length > 0) {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("id", mentorProfileIds)
      .eq("status", "active");
    activeMentors = count ?? 0;
  }

  return {
    totalBeneficiaries: totalBeneficiaries ?? 0,
    activeSponsors: activeSponsors ?? 0,
    pendingApplications: pendingApplications ?? 0,
    totalDonations,
    activeMentors,
    activeMembers: activeMembers ?? 0,
  };
}
