import { Compass } from "lucide-react";
import { CLUSTERS } from "@/lib/career/clusters";
import { maxFrom, topTwo, type AssessmentRow } from "@/lib/career/queries";

const TRACK = { career: "Career", tech: "Tech" } as const;

// Latest career-discovery result for the admin beneficiary profile. A linked
// mentor can also read this row through RLS.
export function CareerAssessmentCard({ latest }: { latest: AssessmentRow | undefined }) {
  const top = latest ? topTwo(latest.top_clusters) : null;
  const scores = (latest?.scores ?? null) as Record<string, number> | null;
  const max = maxFrom(scores);

  return (
    <div className="rounded-[13px] border border-[#e5edf6] bg-white p-5 shadow-[0_8px_28px_rgba(20,55,95,0.07)]">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-[#eee8ff] text-[#7759e8]">
          <Compass className="size-4" />
        </span>
        <h2 className="font-heading text-base font-semibold text-tace-navy">
          Career Assessment
        </h2>
      </div>

      {latest && top ? (
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-xs text-tace-gray/70">
            Taken{" "}
            {new Date(latest.created_at ?? "").toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <div className="flex flex-wrap gap-2">
            {top.map((id, i) => (
              <span
                key={id}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  i === 0 ? "bg-[#e4f5ff] text-[#0795e8]" : "bg-[#f1edff] text-[#7759e8]"
                }`}
              >
                {i === 0 ? "Top: " : "Next: "}
                {CLUSTERS[id].name}
                {scores ? ` (${Math.round(((scores[id] ?? 0) / max) * 100)}%)` : ""}
              </span>
            ))}
          </div>
          <p className="text-sm text-tace-navy">
            <span className="text-tace-gray">Recommended mentor track: </span>
            <strong>
              {latest.recommended_mentor_track
                ? TRACK[latest.recommended_mentor_track]
                : "—"}
            </strong>
          </p>
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-tace-gray uppercase">
              Narrative
            </p>
            {latest.ai_narrative ? (
              <p className="text-sm leading-relaxed whitespace-pre-line text-tace-navy">
                {latest.ai_narrative}
              </p>
            ) : (
              <p className="text-sm text-tace-gray/80">
                No AI narrative was generated for this result (the child saw the
                standard description for their clusters instead).
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-tace-gray/70">
          No career assessment taken yet. It is available to children aged 11
          and over.
        </p>
      )}
    </div>
  );
}
