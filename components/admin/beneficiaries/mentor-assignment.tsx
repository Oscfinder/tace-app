"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { MatchControls } from "@/components/admin/mentors/match-controls";
import { MatchStatusBadge } from "@/components/admin/mentors/badges";
import { assignMentor } from "@/lib/admin/beneficiaries-actions";
import { MAX_ACTIVE_MENTEES } from "@/lib/mentoring/constants";
import type { AssignableMentor } from "@/lib/admin/applications";
import type { MentorshipMatchInfo } from "@/lib/admin/beneficiaries";

const fieldClass =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const card =
  "rounded-[13px] border border-[#e5edf6] bg-white p-5 shadow-[0_8px_28px_rgba(20,55,95,0.07)]";

const OPEN = ["pending_consent", "active", "paused"];

export function MentorAssignment({
  beneficiaryId,
  childName,
  match,
  mentors,
}: {
  beneficiaryId: string;
  childName: string;
  match: MentorshipMatchInfo | null;
  mentors: AssignableMentor[];
}) {
  const router = useRouter();
  const [mentorId, setMentorId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasOpenMatch = !!match && OPEN.includes(match.status);

  if (match && hasOpenMatch) {
    return (
      <div className={card}>
        <h3 className="font-heading text-sm font-semibold text-tace-navy">Mentor</h3>
        <div className="mt-2 text-sm font-medium text-tace-navy">{match.mentorName}</div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <MatchStatusBadge status={match.status} />
        </div>
        {match.status === "pending_consent" ? (
          <p className="mt-2 text-xs text-tace-gray">
            Mentor {match.consentMentor ? "✓ accepted" : "has not answered yet"} · Guardian{" "}
            {match.consentGuardian ? "✓ accepted" : "has not answered yet"}. It becomes active
            automatically once both accept.
          </p>
        ) : null}
        <div className="mt-3">
          <MatchControls matchId={match.id} status={match.status} childName={childName} />
        </div>
      </div>
    );
  }

  async function handleAssign() {
    if (!mentorId) {
      setError("Choose a mentor first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await assignMentor({ beneficiaryId, mentorId });
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({
      title: "Request sent",
      description: "The mentor and the guardian have both been notified.",
      type: "success",
    });
    setMentorId("");
    router.refresh();
  }

  const suggested = mentors.filter((m) => m.suggested);
  const others = mentors.filter((m) => !m.suggested);
  const label = (m: AssignableMentor) =>
    `${m.full_name}${m.profession ? ` — ${m.profession}` : ""} · ${m.load}/${MAX_ACTIVE_MENTEES} mentees${
      m.reasons.length ? ` · ${m.reasons.join("; ")}` : ""
    }`;

  return (
    <div className={card}>
      <h3 className="font-heading text-sm font-semibold text-tace-navy">Assign a Mentor</h3>
      {match ? (
        <p className="mt-1 rounded-lg bg-tace-lgray px-3 py-2 text-xs text-tace-gray">
          The previous match with {match.mentorName} has ended.
        </p>
      ) : null}
      <p className="mt-1 text-xs text-tace-gray/70">
        Only mentors cleared by vetting, with an active account and fewer than {MAX_ACTIVE_MENTEES}{" "}
        mentees are listed. This sends a request; the mentor and the guardian must both accept.
      </p>
      <div className="mt-3 flex flex-col gap-2.5">
        <select
          value={mentorId}
          onChange={(e) => setMentorId(e.target.value)}
          aria-label="Mentor"
          className={fieldClass}
          disabled={mentors.length === 0}
        >
          <option value="">Select a mentor…</option>
          {suggested.length > 0 ? (
            <optgroup label="Suggested for this child">
              {suggested.map((m) => (
                <option key={m.id} value={m.id}>
                  {label(m)}
                </option>
              ))}
            </optgroup>
          ) : null}
          {others.length > 0 ? (
            <optgroup label="Other available mentors">
              {others.map((m) => (
                <option key={m.id} value={m.id}>
                  {label(m)}
                </option>
              ))}
            </optgroup>
          ) : null}
        </select>
        {suggested.length > 0 ? (
          <p className="flex items-center gap-1.5 text-xs text-tace-green">
            <Sparkles className="size-3.5" />
            {suggested.length} suggested by age group and career-quiz track
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-tace-red">
            {error}
          </p>
        ) : null}
        <Button onClick={handleAssign} disabled={submitting || mentors.length === 0 || !mentorId} className="h-10">
          {submitting ? "Sending..." : "Send mentoring request"}
        </Button>
        {mentors.length === 0 ? (
          <p className="text-xs text-tace-gray/70">
            No mentors are available: they must be cleared by vetting, active, and under the cap.
          </p>
        ) : null}
      </div>
    </div>
  );
}
