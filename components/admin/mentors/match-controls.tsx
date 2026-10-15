"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, XCircle } from "lucide-react";
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
import { setMatchStatus } from "@/lib/admin/matches-actions";

// Pause / resume / end a match. The admin never ticks consent for anyone and
// never sets a match "active" from here other than resuming a paused one;
// first-time activation happens only in the database, after both consents.
export function MatchControls({
  matchId,
  status,
  childName,
}: {
  matchId: string;
  status: string | null;
  childName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [ending, setEnding] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function run(action: "pause" | "resume" | "terminate") {
    setBusy(true);
    setError(null);
    const result = await setMatchStatus({ matchId, action, reason });
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      toast.add({ title: "Couldn't update", description: result.error, type: "error" });
      return;
    }
    toast.add({
      title:
        action === "pause" ? "Match paused" : action === "resume" ? "Match resumed" : "Match ended",
      description: "The mentor and guardian have been notified.",
      type: "success",
    });
    setEnding(false);
    setReason("");
    router.refresh();
  }

  const canPause = status === "active";
  const canResume = status === "paused";
  const canEnd = status === "pending_consent" || status === "active" || status === "paused";
  if (!canPause && !canResume && !canEnd) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canPause ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => run("pause")} className="h-9">
            <Pause className="size-4" />
            Pause
          </Button>
        ) : null}
        {canResume ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => run("resume")} className="h-9">
            <Play className="size-4" />
            Resume
          </Button>
        ) : null}
        {canEnd ? (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setError(null);
              setEnding(true);
            }}
            className="h-9 text-tace-red hover:bg-tace-red/10"
          >
            <XCircle className="size-4" />
            {status === "pending_consent" ? "Cancel request" : "End match"}
          </Button>
        ) : null}
      </div>

      <Dialog open={ending} onOpenChange={(o) => !busy && setEnding(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>End this mentorship?</DialogTitle>
            <DialogDescription>
              The mentorship with {childName} will end and messaging stops. The mentor and the
              guardian are told. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <label className="flex flex-col gap-1 text-sm font-medium text-tace-navy">
            Reason (required)
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </label>
          {error ? (
            <p role="alert" className="text-sm text-tace-red">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setEnding(false)}>
              Keep it
            </Button>
            <Button
              disabled={busy || !reason.trim()}
              onClick={() => run("terminate")}
              className="bg-tace-red text-white hover:bg-tace-red/90"
            >
              {busy ? "Ending..." : "End mentorship"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
