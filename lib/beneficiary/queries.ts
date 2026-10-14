import { createClient } from "@/lib/supabase/server";
import { calculateAge } from "@/lib/age";
import type { Database } from "@/types/database";

// Every query here runs under the signed-in beneficiary's own RLS, so it can
// only ever return that child's rows. Nothing touches public_beneficiaries.

export type Stage =
  Database["public"]["Tables"]["beneficiaries"]["Row"]["current_stage"];
export type InterventionRow =
  Database["public"]["Tables"]["interventions"]["Row"];
export type ProgressRow =
  Database["public"]["Tables"]["progress_updates"]["Row"];
export type NotificationRow =
  Database["public"]["Tables"]["notifications"]["Row"];
export type ThankYouRow =
  Database["public"]["Tables"]["thank_you_messages"]["Row"];

export type MyBeneficiary = {
  id: string;
  first_name: string;
  tace_id: string | null;
  current_stage: Stage;
  created_at: string;
  age: number | null;
  photoUrl: string | null;
};

export async function getMyBeneficiary(): Promise<MyBeneficiary | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("beneficiaries")
    .select(
      "id, first_name, tace_id, current_stage, created_at, photo_url, date_of_birth",
    )
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!data) return null;

  let photoUrl: string | null = null;
  // Only photos already moved to {beneficiary_id}/ are readable by the child
  // (see migration 006); a leftover applications/ path simply shows no photo.
  if (data.photo_url && data.photo_url.startsWith(`${data.id}/`)) {
    const { data: signed } = await supabase.storage
      .from("beneficiary-photos")
      .createSignedUrl(data.photo_url, 3600);
    photoUrl = signed?.signedUrl ?? null;
  }

  return {
    id: data.id,
    first_name: data.first_name,
    tace_id: data.tace_id,
    current_stage: data.current_stage ?? "identified",
    created_at: data.created_at ?? new Date().toISOString(),
    age: data.date_of_birth ? calculateAge(data.date_of_birth) : null,
    photoUrl,
  };
}

export async function getMySupport(
  beneficiaryId: string,
): Promise<InterventionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("interventions")
    .select("*")
    .eq("beneficiary_id", beneficiaryId)
    .order("given_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getMyMentor() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("my_mentor")
    .select("full_name, profession, mentor_track")
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getMySponsor() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("my_sponsor")
    .select("first_name")
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getMyThankYous(
  beneficiaryId: string,
): Promise<ThankYouRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("thank_you_messages")
    .select("*")
    .eq("beneficiary_id", beneficiaryId)
    .order("created_at", { ascending: false })
    .limit(10);
  return data ?? [];
}

export async function getMyProgress(
  beneficiaryId: string,
): Promise<ProgressRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("progress_updates")
    .select("*")
    .eq("beneficiary_id", beneficiaryId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getMyCertificates(
  beneficiaryId: string,
): Promise<{ name: string; url: string }[]> {
  const supabase = await createClient();
  const { data: files } = await supabase.storage
    .from("certificates")
    .list(beneficiaryId, { limit: 50 });
  const real = (files ?? []).filter(
    (f) => f.id !== null && f.name !== ".emptyFolderPlaceholder",
  );
  const out: { name: string; url: string }[] = [];
  await Promise.all(
    real.map(async (f) => {
      const { data } = await supabase.storage
        .from("certificates")
        .createSignedUrl(`${beneficiaryId}/${f.name}`, 3600);
      if (data?.signedUrl) out.push({ name: f.name, url: data.signedUrl });
    }),
  );
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getMyNotifications(): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}
