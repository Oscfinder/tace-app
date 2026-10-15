import { Route } from "lucide-react";
import { getMyBeneficiary } from "@/lib/beneficiary/queries";
import { JourneyTracker } from "@/components/shared/journey-tracker";
import { EmptyState, PageHeader } from "@/components/member/ui";

export default async function JourneyPage() {
  const me = await getMyBeneficiary();
  if (!me) {
    return (
      <EmptyState
        icon={Route}
        title="Your journey is about to begin"
        message="Once your profile is ready, you'll see every step of your journey here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="My journey"
        title="Your journey"
        subtitle="Nine steps toward a bright, independent future. Look how far you've come!"
      />
      <JourneyTracker currentStage={me.current_stage} audience="child" />
    </div>
  );
}
