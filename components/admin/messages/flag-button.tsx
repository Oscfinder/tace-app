"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, FlagOff } from "lucide-react";
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
import { flagMessage, unflagMessage } from "@/lib/admin/messages-actions";

// Flag a message (hide it from the other side) or un-flag it (release it) —
// always with a reason, which is kept in the audit log.
export function FlagButton({
  messageId,
  flagged,
}: {
  messageId: string;
  flagged: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    const result = flagged
      ? await unflagMessage({ messageId, reason })
      : await flagMessage({ messageId, reason });
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({
      title: flagged ? "Message released" : "Message flagged",
      description: flagged
        ? "The other person can now see it."
        : "It is hidden from the other person until you release it.",
      type: "success",
    });
    setOpen(false);
    setReason("");
    router.refresh();
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="h-9"
      >
        {flagged ? <FlagOff className="size-4" /> : <Flag className="size-4" />}
        {flagged ? "Unflag" : "Flag"}
      </Button>

      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{flagged ? "Release this message?" : "Flag this message?"}</DialogTitle>
            <DialogDescription>
              {flagged
                ? "The other person will be able to see it. Say why it is fine."
                : "It will be hidden from the other person until you release it. Say why you are flagging it."}
            </DialogDescription>
          </DialogHeader>
          <label className="flex flex-col gap-1 text-sm font-medium text-tace-navy">
            Reason (required)
            <textarea
              rows={3}
              maxLength={300}
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
            <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={busy || !reason.trim()} onClick={submit}>
              {busy ? "Saving..." : flagged ? "Release message" : "Flag message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
