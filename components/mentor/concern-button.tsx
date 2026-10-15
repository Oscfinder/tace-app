"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
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
import { raiseConcern } from "@/lib/mentor/actions";

// Prominent on every mentee page. Sends the concern to the TACE team straight
// away; it never needs the mentor to be certain.
export function ConcernButton({
  beneficiaryId,
  childName,
}: {
  beneficiaryId: string;
  childName: string;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    const result = await raiseConcern({ beneficiaryId, description: text });
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({
      title: "Concern sent",
      description: "Thank you. The TACE team has been told and will follow up.",
      type: "success",
    });
    setOpen(false);
    setText("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ec4f7b] to-[#f06a8f] px-5 text-base font-bold text-white shadow-[0_8px_18px_#ec4f7b33] sm:w-auto"
      >
        <ShieldAlert className="size-5" />
        Raise a concern
      </button>

      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Raise a concern about {childName}</DialogTitle>
            <DialogDescription>
              Tell us what worries you. You don&apos;t need to be certain. The TACE team is told
              immediately and treats this confidentially.
            </DialogDescription>
          </DialogHeader>
          <label className="flex flex-col gap-1 text-sm font-semibold text-m-ink">
            What happened or what worries you?
            <textarea
              rows={5}
              maxLength={2000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-xl border border-m-line bg-[#fbfcfe] px-3.5 py-3 text-base outline-none focus-visible:border-[#89d3f5] focus-visible:ring-4 focus-visible:ring-[#0ba6e820]"
            />
          </label>
          {error ? (
            <p role="alert" className="text-sm font-medium text-[#d63e69]">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={busy || !text.trim()}
              onClick={submit}
              className="bg-[#ec4f7b] text-white hover:bg-[#d63e69]"
            >
              {busy ? "Sending..." : "Send to TACE"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
