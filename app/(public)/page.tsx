import { HeroSection } from "@/components/public/hero-section";
import { Ticker } from "@/components/public/ticker";
import { HowItWorks } from "@/components/public/how-it-works";
import { ImpactStats } from "@/components/public/impact-stats";
import { EmpowermentJourney } from "@/components/public/empowerment-journey";
import { CareerQuizTeaser } from "@/components/public/career-quiz-teaser";
import { SponsorSection } from "@/components/public/sponsor-section";
import { MentorshipSection } from "@/components/public/mentorship-section";
import { StoriesSection } from "@/components/public/stories-section";
import { ProgrammesSection } from "@/components/public/programmes-section";
import { DonateSection } from "@/components/public/donate-section";
import { GetInvolved } from "@/components/public/get-involved";
import { TrustSection } from "@/components/public/trust-section";

import { getHomeData } from "@/lib/public/home-data";

export default async function Home() {
  // The same for every visitor and nothing personal, so it is cached and shared
  // (see lib/public/home-data.ts).
  const { beneficiaries, stories, childrenCount, mentorsCount, projectsCount, totalDonated } =
    await getHomeData();

  return (
    <main>
      <HeroSection
        beneficiaries={beneficiaries}
        childrenCount={childrenCount}
        totalDonated={totalDonated}
      />
      <Ticker />
      <HowItWorks />
      <ImpactStats
        data={{
          childrenCount,
          mentorsCount,
          projectsCount,
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
