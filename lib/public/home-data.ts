import "server-only";
import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase/anon";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FeaturedBeneficiary } from "@/components/public/sponsor-section";
import type { FeaturedStory } from "@/components/public/stories-section";

// The landing page's data. It is the SAME for every visitor and contains nothing
// personal (published stories, children whose guardians gave photography consent
// and who are part of a published project, and four totals), so it is cached for
// everyone and refreshed every 5 minutes, or at once when staff publish something
// (see refreshPublicHome). Data about a signed-in person is NEVER cached.
//
// Everything is read with the anonymous client where possible, so row-level
// security (not just these filters) decides what is public. The service role is
// used only for the totals, which need tables visitors cannot read, and returns
// numbers only.
export const PUBLIC_HOME_TAG = "public-home";
export const PUBLIC_HOME_REVALIDATE_SECONDS = 300;

export type HomeData = {
  beneficiaries: FeaturedBeneficiary[];
  stories: FeaturedStory[];
  childrenCount: number;
  mentorsCount: number;
  projectsCount: number;
  totalDonated: number;
};

async function loadHomeData(): Promise<HomeData> {
  const anon = createAnonClient();
  const admin = createAdminClient();

  const { data: publishedProjects } = await anon
    .from("projects")
    .select("id")
    .eq("is_published", true)
    .neq("status", "archived");
  const publishedProjectIds = (publishedProjects ?? []).map((p) => p.id);

  let publishedIds: string[] = [];
  if (publishedProjectIds.length > 0) {
    const { data: publishedLinks } = await anon
      .from("project_beneficiaries")
      .select("beneficiary_id")
      .in("project_id", publishedProjectIds);
    publishedIds = [...new Set((publishedLinks ?? []).map((l) => l.beneficiary_id))];
  }

  let beneficiaries: FeaturedBeneficiary[] = [];
  if (publishedIds.length > 0) {
    const { data } = await anon
      .from("public_beneficiaries")
      .select("id, first_name, age, current_stage, support_needed, photo_url")
      .in("id", publishedIds)
      .limit(12);
    beneficiaries = await Promise.all(
      (data ?? []).map(async (row) => {
        let photoUrl: string | null = null;
        if (row.photo_url) {
          const { data: signed } = await admin.storage
            .from("beneficiary-photos")
            .createSignedUrl(row.photo_url, 3600);
          photoUrl = signed?.signedUrl ?? null;
        }
        return {
          id: row.id,
          first_name: row.first_name,
          age: row.age,
          current_stage: row.current_stage,
          support_needed: row.support_needed,
          photoUrl,
        };
      }),
    );
  }

  const { data: storyRows } = await anon
    .from("stories")
    .select("id, title, content, excerpt, photo_url, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(3);
  const stories: FeaturedStory[] = (storyRows ?? []).map((story) => ({
    id: story.id,
    title: story.title,
    excerpt: story.excerpt ?? `${story.content.slice(0, 120)}...`,
    photoUrl: story.photo_url
      ? admin.storage.from("public-assets").getPublicUrl(story.photo_url).data.publicUrl
      : null,
    published_at: story.published_at,
  }));

  const { count: childrenCount } = await admin
    .from("beneficiaries")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { data: mentorRows } = await admin.from("mentors").select("profile_id");
  const mentorProfileIds = (mentorRows ?? [])
    .map((m) => m.profile_id)
    .filter((id): id is string => Boolean(id));
  let mentorsCount = 0;
  if (mentorProfileIds.length > 0) {
    const { count } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("id", mentorProfileIds)
      .eq("status", "active");
    mentorsCount = count ?? 0;
  }

  const { count: projectsCount } = await admin
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  const { data: donationRows } = await admin.from("donations").select("amount");
  const totalDonated = (donationRows ?? []).reduce((sum, d) => sum + Number(d.amount), 0);

  return {
    beneficiaries,
    stories,
    childrenCount: childrenCount ?? 0,
    mentorsCount,
    projectsCount: projectsCount ?? 0,
    totalDonated,
  };
}

export const getHomeData = unstable_cache(loadHomeData, ["public-home-v1"], {
  revalidate: PUBLIC_HOME_REVALIDATE_SECONDS,
  tags: [PUBLIC_HOME_TAG],
});
