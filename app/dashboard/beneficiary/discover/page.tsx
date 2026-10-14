import { Compass } from "lucide-react";
import { getMyBeneficiary } from "@/lib/beneficiary/queries";
import { getAssessments, maxFrom, nextAvailable, topTwo } from "@/lib/career/queries";
import { CLUSTERS } from "@/lib/career/clusters";
import { MIN_AGE } from "@/lib/career/score";
import { Quiz } from "@/components/career/quiz";
import { ResultView } from "@/components/career/result-view";
import { Card, EmptyState, PageHeader, Pill, formatDate } from "@/components/member/ui";

export default async function DiscoverPage() {
  const me = await getMyBeneficiary();

  if (!me) {
    return (
      <EmptyState
        icon={Compass}
        title="Career discovery is almost ready"
        message="Once your profile is set up, you'll be able to explore careers here."
      />
    );
  }

  if (me.age !== null && me.age < MIN_AGE) {
    return (
      <EmptyState
        icon={Compass}
        accent="purple"
        title="Coming up when you're a bit older"
        message="Career Discovery is for children aged 11 and over. For now, keep learning and having fun. Your dreams matter!"
      />
    );
  }

  const assessments = await getAssessments(me.id);
  const latest = assessments[0];
  const waitUntil = nextAvailable(latest);
  const latestClusters = latest ? topTwo(latest.top_clusters) : null;
  const older = assessments.slice(1);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Career discovery"
        title="What could you become?"
        subtitle="A short, fun quiz about what you enjoy. There are no wrong answers!"
      />

      {waitUntil && latest && latestClusters ? (
        <>
          <Card className="bg-gradient-to-br from-[#f2faff] to-white">
            <p className="text-[17px] leading-relaxed text-[#4d6584]">
              Here&apos;s your latest result. You can take the quiz again on{" "}
              <strong className="text-m-ink">
                {waitUntil.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </strong>
              .
            </p>
          </Card>
          <ResultView
            data={{
              topClusters: latestClusters,
              scores: (latest.scores as Record<string, number>) ?? {},
              maxScore: maxFrom(latest.scores as Record<string, number> | null),
              narrative: latest.ai_narrative,
              mentorTrack: latest.recommended_mentor_track,
            }}
          />
        </>
      ) : (
        <Quiz />
      )}

      {older.length > 0 || (!waitUntil && latest) ? (
        <section className="flex flex-col gap-3">
          <h2 className="m-head text-lg font-extrabold">Your past results</h2>
          {(waitUntil ? older : assessments).map((a) => {
            const top = topTwo(a.top_clusters);
            return (
              <Card key={a.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[17px] font-bold text-m-ink">
                  {top ? `${CLUSTERS[top[0]].name} + ${CLUSTERS[top[1]].name}` : "Result"}
                </span>
                <Pill accent="blue">{formatDate(a.created_at)}</Pill>
              </Card>
            );
          })}
        </section>
      ) : null}
    </div>
  );
}
