import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type ThankYouRow = Database["public"]["Tables"]["thank_you_messages"]["Row"];

export type ThankYouListItem = ThankYouRow & {
  childName: string;
  sponsorName: string | null;
};

export async function getThankYouMessages(): Promise<ThankYouListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("thank_you_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const childIds = [...new Set(rows.map((r) => r.beneficiary_id))];
  const sponsorIds = [
    ...new Set(rows.map((r) => r.sponsor_id).filter((id): id is string => !!id)),
  ];

  const [{ data: children }, { data: sponsors }] = await Promise.all([
    supabase
      .from("beneficiaries")
      .select("id, first_name, last_name")
      .in("id", childIds),
    sponsorIds.length > 0
      ? supabase.from("sponsors").select("id, profile_id").in("id", sponsorIds)
      : Promise.resolve({ data: [] as { id: string; profile_id: string | null }[] }),
  ]);

  const profileIds = (sponsors ?? [])
    .map((s) => s.profile_id)
    .filter((id): id is string => !!id);
  const { data: profiles } =
    profileIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", profileIds)
      : { data: [] as { id: string; full_name: string }[] };

  const childName = new Map(
    (children ?? []).map((c) => [c.id, `${c.first_name} ${c.last_name}`]),
  );
  const profileName = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  const sponsorName = new Map(
    (sponsors ?? []).map((s) => [
      s.id,
      s.profile_id ? (profileName.get(s.profile_id) ?? null) : null,
    ]),
  );

  return rows.map((r) => ({
    ...r,
    childName: childName.get(r.beneficiary_id) ?? "Unknown child",
    sponsorName: r.sponsor_id ? (sponsorName.get(r.sponsor_id) ?? null) : null,
  }));
}

export async function getPendingThankYouCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("thank_you_messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}
