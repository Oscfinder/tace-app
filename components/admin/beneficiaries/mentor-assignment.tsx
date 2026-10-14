"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { assignMentor } from "@/lib/admin/beneficiaries-actions";
import type { AssignableMentor } from "@/lib/admin/applications";
import type { MentorshipMatchInfo } from "@/lib/admin/beneficiaries";

const STATUS_LABELS: Record<string, string> = {
  pending_consent: "Pending Consent",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  terminated: "Terminated",
};

export function MentorAssignment({
  beneficiaryId,
  match,
  mentors,
}: {
  beneficiaryId: string;
  match: MentorshipMatchInfo | null;
  mentors: AssignableMentor[];
}) {
  const router = useRouter();
  const [mentorId, setMentorId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (match) {
    return (
      <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-5">
        <h3 className="font-heading text-sm font-semibold text-tace-navy">
          Mentor
        </h3>
        <div className="mt-2 text-sm text-tace-navy">{match.mentorName}</div>
        <span className="mt-2 inline-flex items-center rounded-full bg-tace-blue/10 px-2.5 py-1 text-xs font-bold text-tace-blue">
          {STATUS_LABELS[match.status] ?? match.status}
        </span>
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
      title: "Mentor match created",
      description: "Pending the mentor's consent.",
      type: "success",
    });
    router.refresh();
  }

  return (
    <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-5">
      <h3 className="font-heading text-sm font-semibold text-tace-navy">
        Assign a Mentor
      </h3>
      <p className="mt-1 text-xs text-tace-gray/70">
        Creates a pending match — the mentor still needs to accept.
      </p>
      <div className="mt-3 flex flex-col gap-2.5">
        <Select value={mentorId} onValueChange={(v) => setMentorId(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a mentor" />
          </SelectTrigger>
          <SelectContent>
            {mentors.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.full_name}
                {m.profession ? ` — ${m.profession}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error ? <p className="text-sm text-tace-red">{error}</p> : null}
        <Button
          onClick={handleAssign}
          disabled={submitting || mentors.length === 0}
        >
          {submitting ? "Assigning..." : "Assign Mentor"}
        </Button>
        {mentors.length === 0 ? (
          <p className="text-xs text-tace-gray/70">
            No active mentors available.
          </p>
        ) : null}
      </div>
    </div>
  );
}
