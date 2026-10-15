import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type BeneficiaryRow =
  Database["public"]["Tables"]["beneficiaries"]["Row"];
export type InterventionRow =
  Database["public"]["Tables"]["interventions"]["Row"];

export type BeneficiaryListRow = BeneficiaryRow & { photoUrl: string | null };

async function signPhotoUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  photoPath: string | null,
) {
  if (!photoPath) return null;
  const { data } = await supabase.storage
    .from("beneficiary-photos")
    .createSignedUrl(photoPath, 3600);
  return data?.signedUrl ?? null;
}

export async function getBeneficiaries(): Promise<BeneficiaryListRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("beneficiaries")
    .select("*")
    .order("updated_at", { ascending: false });

  const rows = data ?? [];
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      photoUrl: await signPhotoUrl(supabase, row.photo_url),
    })),
  );
}

export async function getBeneficiary(
  id: string,
): Promise<BeneficiaryListRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("beneficiaries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  return { ...data, photoUrl: await signPhotoUrl(supabase, data.photo_url) };
}

export async function getInterventions(
  beneficiaryId: string,
): Promise<InterventionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("interventions")
    .select("*")
    .eq("beneficiary_id", beneficiaryId)
    .order("given_at", { ascending: false });
  return data ?? [];
}

export type LinkedMentor = {
  id: string;
  full_name: string;
  profession: string | null;
};

export async function getLinkedMentor(
  mentorId: string | null,
): Promise<LinkedMentor | null> {
  if (!mentorId) return null;
  const supabase = await createClient();

  const { data: mentor } = await supabase
    .from("mentors")
    .select("id, profile_id, profession")
    .eq("id", mentorId)
    .maybeSingle();
  if (!mentor || !mentor.profile_id) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", mentor.profile_id)
    .maybeSingle();
  if (!profile) return null;

  return {
    id: mentor.id,
    full_name: profile.full_name,
    profession: mentor.profession,
  };
}

export type LinkedSponsor = {
  id: string;
  full_name: string;
};

export async function getLinkedSponsor(
  sponsorId: string | null,
): Promise<LinkedSponsor | null> {
  if (!sponsorId) return null;
  const supabase = await createClient();

  const { data: sponsor } = await supabase
    .from("sponsors")
    .select("id, profile_id")
    .eq("id", sponsorId)
    .maybeSingle();
  if (!sponsor || !sponsor.profile_id) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", sponsor.profile_id)
    .maybeSingle();
  if (!profile) return null;

  return { id: sponsor.id, full_name: profile.full_name };
}

export type MentorshipMatchInfo = {
  id: string;
  status: string;
  mentorName: string;
  consentMentor: boolean;
  consentGuardian: boolean;
};

export async function getMentorshipMatch(
  beneficiaryId: string,
): Promise<MentorshipMatchInfo | null> {
  const supabase = await createClient();

  const { data: match } = await supabase
    .from("mentorship_matches")
    .select("id, mentor_id, status, consent_mentor, consent_guardian")
    .eq("beneficiary_id", beneficiaryId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!match) return null;

  const mentor = await getLinkedMentor(match.mentor_id);
  return {
    id: match.id,
    status: match.status,
    mentorName: mentor?.full_name ?? "Unknown mentor",
    consentMentor: match.consent_mentor ?? false,
    consentGuardian: match.consent_guardian ?? false,
  };
}

export type RecentMessage = {
  id: string;
  sender_type: string | null;
  content: string;
  created_at: string;
};

export async function getRecentMessages(
  beneficiaryId: string,
  limit = 5,
): Promise<RecentMessage[]> {
  const supabase = await createClient();

  const { data: match } = await supabase
    .from("mentorship_matches")
    .select("id")
    .eq("beneficiary_id", beneficiaryId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!match) return [];

  const { data } = await supabase
    .from("mentorship_messages")
    .select("id, sender_type, content, created_at")
    .eq("match_id", match.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export type BeneficiaryDocument = {
  bucket: "documents" | "certificates";
  name: string;
  path: string;
  signedUrl: string | null;
  createdAt: string | null;
};

export async function getDocuments(
  beneficiaryId: string,
): Promise<BeneficiaryDocument[]> {
  const supabase = await createClient();
  const buckets = ["documents", "certificates"] as const;

  const results = await Promise.all(
    buckets.map(async (bucket) => {
      const { data: files } = await supabase.storage
        .from(bucket)
        .list(beneficiaryId);

      const entries = (files ?? []).filter(
        (f) => f.name !== ".emptyFolderPlaceholder",
      );

      return Promise.all(
        entries.map(async (file) => {
          const path = `${beneficiaryId}/${file.name}`;
          const { data: signed } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, 3600);
          return {
            bucket,
            name: file.name,
            path,
            signedUrl: signed?.signedUrl ?? null,
            createdAt: file.created_at ?? null,
          };
        }),
      );
    }),
  );

  return results.flat();
}
