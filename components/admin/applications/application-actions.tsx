"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { STAGE_ORDER, STAGE_LABELS } from "@/lib/beneficiary-stages";
import {
  approveApplication,
  rejectApplication,
  flagApplication,
} from "@/lib/admin/applications-actions";
import type { AssignableMentor } from "@/lib/admin/applications";

const NONE_VALUE = "__none__";

export function ApplicationActions({
  applicationId,
  status,
  mentors,
}: {
  applicationId: string;
  status: string;
  mentors: AssignableMentor[];
}) {
  const router = useRouter();
  const [openDialog, setOpenDialog] = useState<
    "approve" | "reject" | "flag" | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stage, setStage] =
    useState<(typeof STAGE_ORDER)[number]>("identified");
  const [mentorId, setMentorId] = useState<string>(NONE_VALUE);
  const [reason, setReason] = useState("");
  const [flagNote, setFlagNote] = useState("");

  if (status !== "pending" && status !== "flagged") return null;

  async function handleApprove() {
    setSubmitting(true);
    setError(null);
    const result = await approveApplication({
      applicationId,
      currentStage: stage,
      mentorId: mentorId === NONE_VALUE ? null : mentorId,
    });
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setOpenDialog(null);
    toast.add({
      title: "Application approved",
      description: "A beneficiary record and login have been created.",
      type: "success",
    });
    router.push("/dashboard/admin/applications");
  }

  async function handleReject() {
    if (!reason.trim()) {
      setError("A reason is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await rejectApplication({ applicationId, reason });
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setOpenDialog(null);
    toast.add({ title: "Application rejected", type: "success" });
    router.push("/dashboard/admin/applications");
  }

  async function handleFlag() {
    setSubmitting(true);
    setError(null);
    const result = await flagApplication({ applicationId, note: flagNote });
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setOpenDialog(null);
    toast.add({ title: "Application flagged for follow-up", type: "success" });
    router.push("/dashboard/admin/applications");
  }

  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        <Button
          onClick={() => {
            setError(null);
            setOpenDialog("approve");
          }}
          className="bg-tace-green text-white hover:bg-tace-green/90"
        >
          <CheckCircle2 className="size-4" />
          Approve
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setError(null);
            setOpenDialog("reject");
          }}
          className="border-tace-red/30 text-tace-red hover:bg-tace-red/10"
        >
          <XCircle className="size-4" />
          Reject
        </Button>
        {status === "pending" ? (
          <Button
            variant="outline"
            onClick={() => {
              setError(null);
              setOpenDialog("flag");
            }}
          >
            <Flag className="size-4" />
            Flag for Follow-up
          </Button>
        ) : null}
      </div>

      <Dialog
        open={openDialog === "approve"}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Application</DialogTitle>
            <DialogDescription>
              This creates a real beneficiary record and a login account.
              Confirm the starting stage and optionally assign a mentor.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
                Starting Stage
              </label>
              <Select
                value={stage}
                onValueChange={(v) => {
                  if (v) setStage(v as (typeof STAGE_ORDER)[number]);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STAGE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
                Assign Mentor (optional)
              </label>
              <Select
                value={mentorId}
                onValueChange={(v) => setMentorId(v ?? NONE_VALUE)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No mentor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>No mentor</SelectItem>
                  {mentors.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name}
                      {m.profession ? ` — ${m.profession}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-tace-gray/70">
                Creates a pending match — the mentor still needs to accept
                before this is active.
              </p>
            </div>

            {error ? (
              <p className="text-sm text-tace-red">{error}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDialog(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={submitting}
              className="bg-tace-green text-white hover:bg-tace-green/90"
            >
              {submitting ? "Approving..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openDialog === "reject"}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              This reason is sent to the applicant by email.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Explain why this application is being rejected..."
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            {error ? (
              <p className="text-sm text-tace-red">{error}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDialog(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={submitting}
              className="bg-tace-red text-white hover:bg-tace-red/90"
            >
              {submitting ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openDialog === "flag"}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Flag for Follow-up</DialogTitle>
            <DialogDescription>
              Optional note — appended to this application&apos;s admin notes.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <textarea
              value={flagNote}
              onChange={(e) => setFlagNote(e.target.value)}
              rows={3}
              placeholder="What needs following up on? (optional)"
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            {error ? (
              <p className="text-sm text-tace-red">{error}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDialog(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleFlag} disabled={submitting}>
              {submitting ? "Flagging..." : "Confirm Flag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
