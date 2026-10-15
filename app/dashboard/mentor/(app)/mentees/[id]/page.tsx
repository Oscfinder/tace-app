import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Compass, FileText, MessageCircle } from "lucide-react";
import { getMentee } from "@/lib/mentor/queries";
import { STAGE_LABELS } from "@/lib/beneficiary-stages";
import { CLUSTERS } from "@/lib/career/clusters";
import { topTwo } from "@/lib/career/queries";
import { ConcernButton } from "@/components/mentor/concern-button";
import { CheckInForm } from "@/components/mentor/check-in-form";
import { NotesForm } from "@/components/mentor/notes-form";
import { JourneyTracker } from "@/components/shared/journey-tracker";
import { IconTile, Panel, Pill } from "@/components/member/ui";

const TRACKS = { career: "Career", tech: "Tech" } as const;

export default async function MenteePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getMentee(id);
  // Not one of this mentor's active mentees: same answer as "doesn't exist".
  if (!data) notFound();
  const { mentee, photoUrl, notes, assessment, nextCheckIn } = data;
  const clusters = assessment ? topTwo(assessment.top_clusters) : null;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard/mentor/mentees"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#008fda] hover:underline"
      >
        <ArrowLeft className="size-4" />
        All mentees
      </Link>

      <section className="rounded-[22px] border border-m-line bg-white p-5 shadow-m-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={`${mentee.first_name}'s photo`}
              className="size-24 shrink-0 rounded-2xl object-cover ring-4 ring-[#e5f6ff]"
            />
          ) : (
            <span
              className="m-head flex size-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9277f6] to-[#7759e8] text-4xl font-extrabold text-white"
              aria-hidden
            >
              {mentee.first_name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="m-head text-[26px] font-extrabold tracking-[-0.8px] text-m-ink">
              {mentee.first_name}
            </h1>
            <p className="text-sm text-m-muted">
              {mentee.age} years old{mentee.class_level ? ` · ${mentee.class_level}` : ""}
            </p>
            <div className="mt-2">
              <Pill accent="teal">{STAGE_LABELS[mentee.current_stage]}</Pill>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Link
              href={`/dashboard/mentor/messages/${data.matchId}`}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-m-blue to-m-blue2 px-5 text-base font-bold text-white shadow-[0_8px_18px_#009de832] sm:w-auto"
            >
              <MessageCircle className="size-5" />
              Message {mentee.first_name}
            </Link>
            <ConcernButton beneficiaryId={mentee.id} childName={mentee.first_name} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-[#e5f6ff] p-4">
            <p className="text-[11px] font-bold tracking-wide text-[#0795e8] uppercase">Interests</p>
            <p className="mt-1 text-[15px] leading-relaxed text-m-ink">
              {mentee.interests || "Not shared yet"}
            </p>
          </div>
          <div className="rounded-xl bg-[#fff4dc] p-4">
            <p className="text-[11px] font-bold tracking-wide text-[#d99412] uppercase">
              Dreams for the future
            </p>
            <p className="mt-1 text-[15px] leading-relaxed text-m-ink">
              {mentee.aspirations || "Not shared yet"}
            </p>
          </div>
          {mentee.talents ? (
            <div className="rounded-xl bg-[#e4fbf4] p-4">
              <p className="text-[11px] font-bold tracking-wide text-[#0caf91] uppercase">Talents</p>
              <p className="mt-1 text-[15px] leading-relaxed text-m-ink">{mentee.talents}</p>
            </div>
          ) : null}
          {mentee.subjects_skills ? (
            <div className="rounded-xl bg-[#f0ebff] p-4">
              <p className="text-[11px] font-bold tracking-wide text-[#7759e8] uppercase">
                Subjects and skills
              </p>
              <p className="mt-1 text-[15px] leading-relaxed text-m-ink">{mentee.subjects_skills}</p>
            </div>
          ) : null}
        </div>
      </section>

      <Panel title="Next check-in" subtitle="The child's guardian is told when you set it">
        <CheckInForm
          beneficiaryId={mentee.id}
          current={nextCheckIn}
          childName={mentee.first_name}
        />
      </Panel>

      <Panel title="Career discovery" subtitle="From the child's career quiz">
        {assessment && clusters ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <IconTile icon={Compass} accent="purple" size="sm" />
              {clusters.map((c, i) => (
                <Pill key={c} accent={i === 0 ? "blue" : "purple"}>
                  {i === 0 ? "Top: " : "Next: "}
                  {CLUSTERS[c].name}
                </Pill>
              ))}
              {assessment.recommended_mentor_track ? (
                <span className="text-sm text-m-muted">
                  Suggested track: {TRACKS[assessment.recommended_mentor_track]}
                </span>
              ) : null}
            </div>
            {assessment.ai_narrative ? (
              <p className="text-[15px] leading-relaxed whitespace-pre-line text-[#4d6584]">
                {assessment.ai_narrative}
              </p>
            ) : (
              <p className="text-sm text-m-muted">
                {clusters.map((c) => CLUSTERS[c].description).join(" ")}
              </p>
            )}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-m-muted">
            {mentee.first_name} hasn&apos;t taken the career quiz yet.
          </p>
        )}
      </Panel>

      <section>
        <h2 className="m-head mb-3 text-lg font-extrabold text-m-ink">
          {mentee.first_name}&apos;s journey
        </h2>
        <JourneyTracker currentStage={mentee.current_stage} audience="mentor" />
      </section>

      <Panel title="Write notes" subtitle="A record of each check-in, visible to the TACE team">
        <NotesForm beneficiaryId={mentee.id} />
      </Panel>

      <Panel
        title="Notes history"
        subtitle={`${notes.length} ${notes.length === 1 ? "entry" : "entries"}, newest first`}
      >
        {notes.length > 0 ? (
          <ul>
            {notes.map((n) => (
              <li
                key={n.id}
                className="flex gap-3 border-t border-[#eff3f7] py-4 first:border-t-0"
              >
                <IconTile icon={FileText} accent="amber" size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="m-head text-[15px] font-extrabold text-m-ink">
                    Check-in on{" "}
                    {new Date(n.check_in_date ?? n.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  {(
                    [
                      ["Topics discussed", n.topics_discussed],
                      ["Improvements", n.improvements],
                      ["Concerns", n.concerns],
                      ["Next steps", n.next_steps],
                    ] as const
                  )
                    .filter(([, v]) => v)
                    .map(([label, v]) => (
                      <p key={label} className="mt-1.5 text-[15px] leading-relaxed text-[#4d6584]">
                        <span className="font-semibold text-m-ink">{label}: </span>
                        {v}
                      </p>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-m-muted">
            <ClipboardList className="size-6" aria-hidden />
            No notes yet. After your next check-in, write what you talked about.
          </div>
        )}
      </Panel>
    </div>
  );
}
