import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export type StoryRow = Database["public"]["Tables"]["stories"]["Row"];
export type AnnouncementRow =
  Database["public"]["Tables"]["announcements"]["Row"];

export type StoryListRow = StoryRow & {
  beneficiaryName: string | null;
  photoUrl: string | null;
};

function publicAssetUrl(path: string | null) {
  if (!path) return null;
  const admin = createAdminClient();
  return admin.storage.from("public-assets").getPublicUrl(path).data.publicUrl;
}

async function attachBeneficiaryNames(
  supabase: Awaited<ReturnType<typeof createClient>>,
  stories: StoryRow[],
): Promise<StoryListRow[]> {
  const beneficiaryIds = stories
    .map((s) => s.beneficiary_id)
    .filter((id): id is string => Boolean(id));

  const nameById = new Map<string, string>();
  if (beneficiaryIds.length > 0) {
    const { data } = await supabase
      .from("beneficiaries")
      .select("id, first_name, last_name")
      .in("id", beneficiaryIds);
    for (const b of data ?? []) {
      nameById.set(b.id, `${b.first_name} ${b.last_name}`);
    }
  }

  return stories.map((s) => ({
    ...s,
    beneficiaryName: s.beneficiary_id
      ? (nameById.get(s.beneficiary_id) ?? null)
      : null,
    photoUrl: publicAssetUrl(s.photo_url),
  }));
}

export async function getStories(): Promise<StoryListRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false });
  return attachBeneficiaryNames(supabase, data ?? []);
}

export async function getStory(id: string): Promise<StoryListRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const [row] = await attachBeneficiaryNames(supabase, [data]);
  return row ?? null;
}

export type BeneficiaryOption = {
  id: string;
  first_name: string;
  last_name: string;
};

export async function getBeneficiaryOptions(): Promise<BeneficiaryOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("beneficiaries")
    .select("id, first_name, last_name")
    .order("first_name");
  return data ?? [];
}

/** Same safeguard as Ticket 2F's project publish check: a story linked to a
 * beneficiary can only publish if that child's original application has
 * consent_photography=true. Returns null (no warning) if unlinked. */
export async function getStoryConsentWarning(
  beneficiaryId: string | null,
): Promise<string | null> {
  if (!beneficiaryId) return null;
  const supabase = await createClient();

  const { data: beneficiary } = await supabase
    .from("beneficiaries")
    .select("first_name, last_name, application_id")
    .eq("id", beneficiaryId)
    .maybeSingle();
  if (!beneficiary) return null;

  if (!beneficiary.application_id) {
    return `${beneficiary.first_name} ${beneficiary.last_name} has no linked application on file to check consent against.`;
  }

  const { data: application } = await supabase
    .from("applications")
    .select("consent_photography")
    .eq("id", beneficiary.application_id)
    .maybeSingle();

  if (!application?.consent_photography) {
    return `${beneficiary.first_name} ${beneficiary.last_name} doesn't have photography consent on file.`;
  }
  return null;
}

export async function getAnnouncements(): Promise<AnnouncementRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}
