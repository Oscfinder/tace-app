import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

// Everything here runs under the signed-in sponsor's own RLS and reads ONLY:
//   - the narrow views from migration 008 (sponsor_children,
//     sponsor_child_support) — never `beneficiaries` or `applications`;
//   - progress_updates / thank_you_messages, whose policies already limit a
//     sponsor to their linked children (and approved messages);
//   - the sponsor's own donations.

export type SponsorChild = Database["public"]["Views"]["sponsor_children"]["Row"] & {
  photoUrl: string | null;
};
export type ProgressRow = Pick<
  Database["public"]["Tables"]["progress_updates"]["Row"],
  "id" | "beneficiary_id" | "title" | "content" | "created_at"
>;
export type SupportRow = Database["public"]["Views"]["sponsor_child_support"]["Row"];
export type DonationRow = Pick<
  Database["public"]["Tables"]["donations"]["Row"],
  "id" | "amount" | "currency" | "purpose" | "receipt_sent" | "receipt_sent_at" | "created_at"
>;
export type ThankYouRow = Pick<
  Database["public"]["Tables"]["thank_you_messages"]["Row"],
  "id" | "beneficiary_id" | "content" | "created_at"
>;

export type SponsorProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
};

export async function getSponsorProfile(): Promise<SponsorProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone")
    .eq("id", user.id)
    .single();
  return data;
}

export async function getSponsorChildren(): Promise<SponsorChild[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sponsor_children")
    .select("*")
    .order("first_name");
  const rows = data ?? [];

  return Promise.all(
    rows.map(async (c) => {
      let photoUrl: string | null = null;
      // Readable only once the photo lives in {child_id}/ (see migration 008).
      if (c.photo_url && c.photo_url.startsWith(`${c.id}/`)) {
        const { data: signed } = await supabase.storage
          .from("beneficiary-photos")
          .createSignedUrl(c.photo_url, 3600);
        photoUrl = signed?.signedUrl ?? null;
      }
      return { ...c, photoUrl };
    }),
  );
}

export async function getProgressUpdates(): Promise<ProgressRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("progress_updates")
    .select("id, beneficiary_id, title, content, created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getSupportUsed(): Promise<SupportRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sponsor_child_support")
    .select("*")
    .order("given_at", { ascending: false, nullsFirst: false });
  return data ?? [];
}

// Explicit columns on purpose: the donations row also holds internal notes,
// the bank reference and who logged it, which a sponsor has no need to see.
export async function getMyDonations(sponsorId?: string): Promise<DonationRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("donations")
    .select("id, amount, currency, purpose, receipt_sent, receipt_sent_at, created_at")
    .order("created_at", { ascending: false });
  // RLS already restricts to the caller's own donations; this is belt and braces.
  if (sponsorId) query = query.eq("sponsor_id", sponsorId);
  const { data } = await query;
  return data ?? [];
}

export async function getMySponsorId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("sponsors")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  return data?.id ?? null;
}

export async function getApprovedThankYous(): Promise<ThankYouRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("thank_you_messages")
    .select("id, beneficiary_id, content, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  return data ?? [];
}
