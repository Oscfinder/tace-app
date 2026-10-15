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
import { raiseChatConcern } from "@/lib/messaging/actions";

// "Something doesn't feel right": a short form that tells the TACE team. The
// chat stays open underneath; nothing here ends or hides the conversation.
export function ChatConcern({ matchId }: { matchId: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    const result = await raiseChatConcern({ matchId, description: text });
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({
      title: "Thank you for telling us",
      description: "The TACE team has been told and will look into it.",
      type: "success",
    });
    setText("");
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="flex min-h-11 items-center gap-1.5 rounded-xl border border-[#ffd3df] bg-[#fff1f4] px-3.5 text-sm font-bold text-[#c2365c] hover:bg-[#ffe6ec]"
      >
        <ShieldAlert className="size-4" />
        Something doesn&apos;t feel right
      </button>

      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tell the TACE team</DialogTitle>
            <DialogDescription>
              If anything in this conversation worries you or makes you uncomfortable, tell us. You
              won&apos;t be in trouble, and you don&apos;t have to be sure.
            </DialogDescription>
          </DialogHeader>
          <label className="flex flex-col gap-1 text-sm font-semibold text-m-ink">
            What happened?
            <textarea
              rows={4}
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
