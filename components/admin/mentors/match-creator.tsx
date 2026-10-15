"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { createMatch } from "@/lib/admin/matches-actions";
import type { ChildCandidate } from "@/lib/admin/mentors";

const fieldClass =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

// From a mentor's page: pick a child for this (cleared, active, under-cap)
// mentor. Suggested children come first, with the reason. Creating the match
// sends a pending request to both the mentor and the guardian.
export function MatchCreator({
  mentorId,
  candidates,
  load,
  maxLoad,
}: {
  mentorId: string;
  candidates: ChildCandidate[];
  load: number;
  maxLoad: number;
}) {
  const router = useRouter();
  const [childId, setChildId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggested = candidates.filter((c) => c.suggested);
  const others = candidates.filter((c) => !c.suggested);

  async function submit() {
    if (!childId) {
      setError("Choose a child first.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await createMatch({ beneficiaryId: childId, mentorId });
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({
      title: "Request sent",
      description: "The mentor and the guardian have both been notified.",
      type: "success",
    });
    setChildId("");
    router.refresh();
  }

  const label = (c: ChildCandidate) =>
    `${c.name} (${c.age})${c.reasons.length ? ` — ${c.reasons.join("; ")}` : ""}`;

  return (
    <section className="rounded-[13px] border border-[#e5edf6] bg-white p-5 shadow-[0_8px_28px_rgba(20,55,95,0.07)]">
      <h2 className="font-heading text-base font-semibold text-tace-navy">Match with a child</h2>
      <p className="mt-1 text-xs text-tace-gray/70">
        This mentor has {load} of {maxLoad} mentees (active or awaiting consent). A match starts as
        a request; the mentor and the guardian must each accept before it goes active.
      </p>
      {candidates.length === 0 ? (
        <p className="mt-3 text-sm text-tace-gray/70">
          No children are waiting for a mentor right now.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2.5">
          <select
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
            aria-label="Child to match"
            className={fieldClass}
          >
            <option value="">Select a child…</option>
            {suggested.length > 0 ? (
              <optgroup label="Suggested">
                {suggested.map((c) => (
                  <option key={c.id} value={c.id}>
                    {label(c)}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {others.length > 0 ? (
              <optgroup label="Other children without a mentor">
                {others.map((c) => (
                  <option key={c.id} value={c.id}>
                    {label(c)}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
          {error ? (
            <p role="alert" className="text-sm text-tace-red">
              {error}
            </p>
          ) : null}
          <Button onClick={submit} disabled={busy || !childId} className="h-10 self-start">
            {busy ? "Sending..." : "Send mentoring request"}
          </Button>
        </div>
      )}
    </section>
  );
}
