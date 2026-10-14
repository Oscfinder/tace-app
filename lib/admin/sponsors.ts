import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type SponsorRow = Database["public"]["Tables"]["sponsors"]["Row"];
export type DonationRow = Database["public"]["Tables"]["donations"]["Row"];

export type SponsorListRow = SponsorRow & {
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  // null unless this sponsor has *exactly one* linked beneficiary — the
  // donation logger's "default to the sponsor's child" only ever applies
  // in that unambiguous case, per how this is meant to behave.
  linkedBeneficiaryId: string | null;
  linkedBeneficiaryName: string | null;
  linkedBeneficiaryCount: number;
};

async function buildSponsorListRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sponsors: SponsorRow[],
): Promise<SponsorListRow[]> {
  if (sponsors.length === 0) return [];

  const profileIds = sponsors
    .map((s) => s.profile_id)
    .filter((id): id is string => Boolean(id));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, status")
    .in("id", profileIds.length > 0 ? profileIds : [""]);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const { data: linkedBeneficiaries } = await supabase
    .from("beneficiaries")
    .select("id, sponsor_id, first_name, last_name")
    .in(
      "sponsor_id",
      sponsors.map((s) => s.id),
    );
  const bySponsor = new Map<string, { id: string; name: string }[]>();
  for (const b of linkedBeneficiaries ?? []) {
    const key = b.sponsor_id as string;
    const list = bySponsor.get(key) ?? [];
    list.push({ id: b.id, name: `${b.first_name} ${b.last_name}` });
    bySponsor.set(key, list);
  }

  return sponsors.map((sponsor) => {
    const profile = sponsor.profile_id
      ? profileMap.get(sponsor.profile_id)
      : undefined;
    const linked = bySponsor.get(sponsor.id) ?? [];
    return {
      ...sponsor,
      full_name: profile?.full_name ?? "Unknown",
      email: profile?.email ?? "",
      phone: profile?.phone ?? null,
      status: profile?.status ?? "pending",
      linkedBeneficiaryId: linked.length === 1 ? linked[0].id : null,
      linkedBeneficiaryName:
        linked.length === 0
          ? null
          : linked.length === 1
            ? linked[0].name
            : linked.map((l) => l.name).join(", "),
      linkedBeneficiaryCount: linked.length,
    };
  });
}

export async function getSponsors(): Promise<SponsorListRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sponsors")
    .select("*")
    .order("created_at", { ascending: false });
  return buildSponsorListRows(supabase, data ?? []);
}

export async function getSponsor(id: string): Promise<SponsorListRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sponsors")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const [row] = await buildSponsorListRows(supabase, [data]);
  return row ?? null;
}

export type UnsponsoredBeneficiary = {
  id: string;
  first_name: string;
  last_name: string;
};

export async function getUnsponsoredBeneficiaries(): Promise<
  UnsponsoredBeneficiary[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("beneficiaries")
    .select("id, first_name, last_name")
    .is("sponsor_id", null)
    .order("first_name");
  return data ?? [];
}

export async function getDonations(sponsorId: string): Promise<DonationRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("donations")
    .select("*")
    .eq("sponsor_id", sponsorId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getAllDonations(): Promise<DonationRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("donations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

export type BeneficiaryOption = {
  id: string;
  first_name: string;
  last_name: string;
};

export async function getAllBeneficiaries(): Promise<BeneficiaryOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("beneficiaries")
    .select("id, first_name, last_name")
    .order("first_name");
  return data ?? [];
}

export type ProjectOption = { id: string; title: string };

export async function getProjectOptions(): Promise<ProjectOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, title")
    .order("title");
  return data ?? [];
}

export type ActiveSponsorOption = {
  id: string;
  full_name: string;
  linkedBeneficiaryId: string | null;
  linkedBeneficiaryName: string | null;
  linkedBeneficiaryCount: number;
};

export async function getActiveSponsorOptions(): Promise<
  ActiveSponsorOption[]
> {
  const supabase = await createClient();
  const { data: sponsorRows } = await supabase.from("sponsors").select("*");
  const rows = await buildSponsorListRows(supabase, sponsorRows ?? []);

  return rows
    .filter((s) => s.status === "active")
    .map((s) => ({
      id: s.id,
      full_name: s.full_name,
      linkedBeneficiaryId: s.linkedBeneficiaryId,
      linkedBeneficiaryName: s.linkedBeneficiaryName,
      linkedBeneficiaryCount: s.linkedBeneficiaryCount,
    }));
}
