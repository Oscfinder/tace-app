import { notFound } from "next/navigation";
import Link from "next/link";
import { getMentorDetail } from "@/lib/admin/mentors";
import { MAX_ACTIVE_MENTEES, TRACK_LABELS } from "@/lib/mentoring/constants";
import { VettingPanel } from "@/components/admin/mentors/vetting-panel";
import { AccountPanel } from "@/components/admin/mentors/account-panel";
import { MatchCreator } from "@/components/admin/mentors/match-creator";
import { MatchControls } from "@/components/admin/mentors/match-controls";
import { MatchStatusBadge, VettingBadge } from "@/components/admin/mentors/badges";

const card =
  "rounded-[13px] border border-[#e5edf6] bg-white p-5 shadow-[0_8px_28px_rgba(20,55,95,0.07)]";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#F1F3F6] py-2.5 text-sm last:border-b-0">
      <span className="text-tace-gray">{label}</span>
      <span className="text-right font-medium text-tace-navy">{value || "—"}</span>
    </div>
  );
}

export default async function MentorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getMentorDetail(id);
  if (!detail) notFound();
  const { mentor, profile, vetterName, checklist, matches, load, canMatch, candidates } = detail;

  return (
    <div className="flex flex-col gap-5 pt-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-2xl font-bold text-tace-navy">{profile.full_name}</h1>
        <VettingBadge status={mentor.vetting_status} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1.1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <VettingPanel
            mentorId={mentor.id}
            status={mentor.vetting_status}
            initialChecklist={checklist}
            initialNotes={mentor.vetting_notes ?? ""}
            decidedBy={vetterName}
            decidedAt={mentor.vetted_at}
          />

          <section className={card}>
            <h2 className="font-heading text-base font-semibold text-tace-navy">
              Mentees and matches
            </h2>
            {matches.length > 0 ? (
              <div className="mt-2">
                {matches.map((m) => (
                  <div key={m.id} className="flex flex-col gap-2 border-b border-[#F1F3F6] py-3 last:border-b-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/dashboard/admin/beneficiaries/${m.beneficiaryId}`}
                        className="text-sm font-semibold text-tace-blue hover:underline"
                      >
                        {m.childName}
                      </Link>
                      <MatchStatusBadge status={m.status} />
                      {m.status === "pending_consent" ? (
                        <span className="text-xs text-tace-gray">
                          Mentor {m.consentMentor ? "✓ accepted" : "waiting"} · Guardian{" "}
                          {m.consentGuardian ? "✓ accepted" : "waiting"}
                        </span>
                      ) : null}
                    </div>
                    <MatchControls matchId={m.id} status={m.status} childName={m.childName} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-tace-gray/70">No matches yet.</p>
            )}
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <AccountPanel
            mentorId={mentor.id}
            accountStatus={profile.status}
            cleared={mentor.vetting_status === "cleared"}
            codeAcceptedAt={mentor.code_of_conduct_accepted_at}
          />

          {canMatch ? (
            <MatchCreator
              mentorId={mentor.id}
              candidates={candidates}
              load={load}
              maxLoad={MAX_ACTIVE_MENTEES}
            />
          ) : (
            <section className={card}>
              <h2 className="font-heading text-base font-semibold text-tace-navy">
                Match with a child
              </h2>
              <p className="mt-2 text-sm text-tace-gray">
                {mentor.vetting_status !== "cleared"
                  ? "This mentor can be matched once they are cleared by vetting."
                  : profile.status !== "active"
                    ? "Activate this mentor's account before matching them."
                    : `This mentor already has ${load} mentees, the maximum of ${MAX_ACTIVE_MENTEES}.`}
              </p>
            </section>
          )}

          <section className={card}>
            <h2 className="font-heading text-base font-semibold text-tace-navy">Signup details</h2>
            <div className="mt-2">
              <Row label="Email" value={profile.email} />
              <Row label="Phone" value={profile.phone} />
              <Row label="Track" value={mentor.mentor_track ? TRACK_LABELS[mentor.mentor_track] : null} />
              <Row label="Profession" value={mentor.profession} />
              <Row label="Expertise" value={mentor.expertise} />
              <Row label="Availability" value={mentor.availability} />
              <Row label="Preferred age group" value={mentor.preferred_age_group} />
              <Row
                label="Signed up"
                value={new Date(profile.created_at ?? "").toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              />
            </div>
            {mentor.motivation ? (
              <div className="mt-3 rounded-lg bg-tace-lgray p-3">
                <p className="text-[11px] font-bold tracking-wide text-tace-gray uppercase">
                  Why they want to mentor
                </p>
                <p className="mt-1 text-sm whitespace-pre-line text-tace-navy">{mentor.motivation}</p>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
