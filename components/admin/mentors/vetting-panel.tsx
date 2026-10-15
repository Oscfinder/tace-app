"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck, ShieldX } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { VettingBadge } from "@/components/admin/mentors/badges";
import {
  clearMentor,
  rejectMentor,
  saveVettingProgress,
} from "@/lib/admin/mentors-actions";
import {
  VETTING_ITEMS,
  checklistComplete,
  type VettingChecklist,
} from "@/lib/mentoring/constants";

export function VettingPanel({
  mentorId,
  status,
  initialChecklist,
  initialNotes,
  decidedBy,
  decidedAt,
}: {
  mentorId: string;
  status: "pending" | "cleared" | "rejected";
  initialChecklist: VettingChecklist;
  initialNotes: string;
  decidedBy: string | null;
  decidedAt: string | null;
}) {
  const router = useRouter();
  const [checklist, setChecklist] = useState<VettingChecklist>(initialChecklist);
  const [notes, setNotes] = useState(initialNotes);
  const [busy, setBusy] = useState<null | "save" | "clear" | "reject">(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);

  const complete = checklistComplete(checklist);

  async function run(kind: "save" | "clear" | "reject") {
    setBusy(kind);
    setError(null);
    const input = { mentorId, checklist, notes };
    const result =
      kind === "save"
        ? await saveVettingProgress(input)
        : kind === "clear"
          ? await clearMentor(input)
          : await rejectMentor(input);
    setBusy(null);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({
      title:
        kind === "save"
          ? "Progress saved"
          : kind === "clear"
            ? "Mentor cleared"
            : "Mentor rejected",
      description: kind === "save" ? undefined : "An email has been sent to the mentor.",
      type: "success",
    });
    setConfirmReject(false);
    router.refresh();
  }

  const card =
    "rounded-[13px] border border-[#e5edf6] bg-white p-5 shadow-[0_8px_28px_rgba(20,55,95,0.07)]";

  return (
    <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-base font-semibold text-tace-navy">Vetting</h2>
        <VettingBadge status={status} />
      </div>
      <p className="mt-1 text-xs text-tace-gray/70">
        A mentor works with a child, so every check below must be done before they can be cleared.
        Only clearing allows them to be matched.
      </p>

      {status !== "pending" && decidedAt ? (
        <p className="mt-3 rounded-lg bg-tace-lgray px-3 py-2 text-xs text-tace-gray">
          {status === "cleared" ? "Cleared" : "Rejected"}
          {decidedBy ? ` by ${decidedBy}` : ""} on{" "}
          {new Date(decidedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          . You can still change the decision below.
        </p>
      ) : null}

      <fieldset className="mt-4">
        <legend className="sr-only">Vetting checklist</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {VETTING_ITEMS.map((item) => (
            <label
              key={item.key}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-[#e5edf6] bg-white px-3 py-2 text-sm text-tace-navy has-[:checked]:border-tace-green has-[:checked]:bg-[#f2fbf6]"
            >
              <input
                type="checkbox"
                checked={checklist[item.key] === true}
                onChange={(e) =>
                  setChecklist((c) => ({ ...c, [item.key]: e.target.checked }))
                }
                className="size-4 accent-tace-green"
              />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-4 flex flex-col gap-1 text-sm font-medium text-tace-navy">
        Vetting notes
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Who was spoken to, what was checked, any concerns… (required to reject)"
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-tace-red">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" disabled={busy !== null} onClick={() => run("save")} className="h-10">
          {busy === "save" ? "Saving..." : "Save progress"}
        </Button>
        <Button
          disabled={busy !== null || !complete}
          onClick={() => run("clear")}
          className="h-10 bg-tace-green text-white hover:bg-tace-green/90"
        >
          <ShieldCheck className="size-4" />
          {busy === "clear" ? "Clearing..." : "Clear mentor"}
        </Button>
        <Button
          variant="outline"
          disabled={busy !== null}
          onClick={() => {
            setError(null);
            if (!notes.trim()) {
              setError("Please add a note explaining the decision first.");
              return;
            }
            setConfirmReject(true);
          }}
          className="h-10 text-tace-red hover:bg-tace-red/10"
        >
          <ShieldX className="size-4" />
          Reject
        </Button>
      </div>
      {!complete ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-tace-gray/70">
          <Check className="size-3.5" />
          Tick all four checks to enable &ldquo;Clear mentor&rdquo;.
        </p>
      ) : null}

      <Dialog open={confirmReject} onOpenChange={(o) => busy === null && setConfirmReject(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject this mentor?</DialogTitle>
            <DialogDescription>
              Their account is deactivated, any open matches end (and the guardians are told), and
              they are emailed. You can change the decision later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={busy !== null} onClick={() => setConfirmReject(false)}>
              Cancel
            </Button>
            <Button
              disabled={busy !== null}
              onClick={() => run("reject")}
              className="bg-tace-red text-white hover:bg-tace-red/90"
            >
              {busy === "reject" ? "Rejecting..." : "Yes, reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
