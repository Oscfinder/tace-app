import Link from "next/link";
import { GraduationCap, Rocket, Sparkles } from "lucide-react";
import { CLUSTERS, type ClusterId } from "@/lib/career/clusters";
import { ACCENTS, Card, IconTile } from "@/components/member/ui";

const TRACK_LABEL = { career: "Career guidance", tech: "Technology skills" } as const;

export type ResultData = {
  topClusters: [ClusterId, ClusterId];
  scores: Record<string, number>;
  maxScore: number;
  narrative: string | null;
  mentorTrack: "career" | "tech" | null;
};

// Shown right after the quiz and for saved results. If there is no AI
// narrative (no key, timeout, error) it falls back to the fixed cluster
// descriptions, so the child always gets a complete result.
export function ResultView({ data }: { data: ResultData }) {
  const [first, second] = data.topClusters;
  const top = CLUSTERS[first];

  return (
    <div className="flex flex-col gap-5">
      <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#087dbd] via-[#0a93d6] to-[#05a9e6] p-6 text-white shadow-[0_12px_25px_#068dd51c]">
        <span
          className="pointer-events-none absolute -top-5 right-3 text-[110px] leading-none text-white/10"
          aria-hidden
        >
          ✦
        </span>
        <p className="relative text-sm font-semibold text-[#d9f3ff]">
          Your strongest match
        </p>
        <h2 className="m-head relative mt-1 text-3xl font-extrabold">{top.name}</h2>
        <p className="relative mt-2 text-[17px] leading-relaxed text-[#eaf8ff]">
          Next closest: {CLUSTERS[second].name}
        </p>
      </section>

      <Card className="flex flex-col gap-4">
        <h3 className="m-head text-lg font-extrabold text-m-ink">
          Your top two matches
        </h3>
        {data.topClusters.map((id) => {
          const c = CLUSTERS[id];
          const pct = Math.round(((data.scores[id] ?? 0) / data.maxScore) * 100);
          const { fg, wash } = ACCENTS[c.accent];
          return (
            <div key={id}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-[17px] font-bold text-m-ink">{c.name}</span>
                <span className="m-head text-lg font-extrabold" style={{ color: fg }}>
                  {pct}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${c.name} match`}
                className="h-4 overflow-hidden rounded-full"
                style={{ background: wash }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: fg }}
                />
              </div>
            </div>
          );
        })}
      </Card>

      <Card>
        <div className="mb-3 flex items-center gap-3">
          <IconTile icon={Sparkles} accent="amber" size="sm" />
          <h3 className="m-head text-lg font-extrabold text-m-ink">About you</h3>
        </div>
        {data.narrative ? (
          <div className="flex flex-col gap-3 text-[17px] leading-relaxed text-[#4d6584]">
            {data.narrative
              .split(/\n{2,}/)
              .filter(Boolean)
              .map((p, i) => (
                <p key={i}>{p}</p>
              ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4 text-[17px] leading-relaxed text-[#4d6584]">
            {data.topClusters.map((id) => (
              <div key={id}>
                <p className="font-bold text-m-ink">{CLUSTERS[id].name}</p>
                <p>{CLUSTERS[id].description}</p>
                <p className="mt-1 text-[15px]">
                  Jobs people like you often do:{" "}
                  {CLUSTERS[id].roles.join(", ")}.
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <section className="grid gap-3 sm:grid-cols-2" aria-label="Next steps">
        <Card className="flex flex-col gap-2">
          <IconTile icon={Rocket} accent="teal" />
          <h3 className="m-head text-lg font-extrabold text-m-ink">
            Your TACE programme
          </h3>
          <p className="text-[17px] font-semibold text-[#0a8f78]">
            {top.programme}
          </p>
          <p className="text-[15px] text-m-muted">
            Ask the TACE team about joining this programme.
          </p>
        </Card>
        <Card className="flex flex-col gap-2">
          <IconTile icon={GraduationCap} accent="purple" />
          <h3 className="m-head text-lg font-extrabold text-m-ink">
            Suggested mentor track
          </h3>
          <p className="text-[17px] font-semibold text-[#7759e8]">
            {data.mentorTrack ? TRACK_LABEL[data.mentorTrack] : TRACK_LABEL[top.mentorTrack]}
          </p>
          <Link
            href="/dashboard/beneficiary/mentor"
            className="mt-1 flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-m-blue to-m-blue2 text-base font-bold text-white"
          >
            Go to My Mentor
          </Link>
        </Card>
      </section>
    </div>
  );
}
