import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { HeroSection } from "@/components/public/hero-section";
import { Ticker } from "@/components/public/ticker";
import { HowItWorks } from "@/components/public/how-it-works";
import { ImpactStats } from "@/components/public/impact-stats";
import { EmpowermentJourney } from "@/components/public/empowerment-journey";
import { CareerQuizTeaser } from "@/components/public/career-quiz-teaser";
import {
  SponsorSection,
  type FeaturedBeneficiary,
} from "@/components/public/sponsor-section";
import { MentorshipSection } from "@/components/public/mentorship-section";
import {
  StoriesSection,
  type FeaturedStory,
} from "@/components/public/stories-section";
import { ProgrammesSection } from "@/components/public/programmes-section";
import { DonateSection } from "@/components/public/donate-section";
import { GetInvolved } from "@/components/public/get-involved";
import { TrustSection } from "@/components/public/trust-section";

export default async function Home() {
  const supabase = await createClient();
  const admin = createAdminClient();

  // Beneficiaries that belong to at least one published, non-archived
  // project. RLS (project_beneficiaries_published_select /
  // projects_published_select, migration 003) already enforces this same
  // restriction for anon reads — this explicit filter is defense-in-depth
  // on top of that, not instead of it, so the query is still correct even
  // if it were ever run through a client that bypasses RLS.
  const { data: publishedProjects } = await supabase
    .from("projects")
    .select("id")
    .eq("is_published", true)
    .neq("status", "archived");
  const publishedProjectIds = (publishedProjects ?? []).map((p) => p.id);

  let publishedIds: string[] = [];
  if (publishedProjectIds.length > 0) {
    const { data: publishedLinks } = await supabase
      .from("project_beneficiaries")
      .select("beneficiary_id")
      .in("project_id", publishedProjectIds);
    publishedIds = [
      ...new Set((publishedLinks ?? []).map((l) => l.beneficiary_id)),
    ];
  }

  let beneficiaries: FeaturedBeneficiary[] = [];
  if (publishedIds.length > 0) {
    const { data } = await supabase
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

  const { data: storyRows } = await supabase
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
      ? admin.storage.from("public-assets").getPublicUrl(story.photo_url).data
          .publicUrl
      : null,
    published_at: story.published_at,
  }));

  // Aggregate stats need tables that are otherwise correctly locked down
  // from anon access (donations, mentors, non-published projects) — only
  // the resulting counts are exposed, never the underlying rows.
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
  const totalDonated = (donationRows ?? []).reduce(
    (sum, d) => sum + Number(d.amount),
    0,
  );

  return (
    <main>
      <HeroSection
        beneficiaries={beneficiaries}
        childrenCount={childrenCount ?? 0}
        totalDonated={totalDonated}
      />
      <Ticker />
      <HowItWorks />
      <ImpactStats
        data={{
          childrenCount: childrenCount ?? 0,
          mentorsCount,
          projectsCount: projectsCount ?? 0,
          totalDonated,
        }}
      />
      <EmpowermentJourney />
      <CareerQuizTeaser />
      <SponsorSection beneficiaries={beneficiaries.slice(0, 3)} />
      <MentorshipSection />
      <StoriesSection stories={stories} />
      <ProgrammesSection />
      <DonateSection />
      <GetInvolved />
      <TrustSection />
    </main>
  );
}
