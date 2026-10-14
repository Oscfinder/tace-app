"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { setRsvp } from "@/lib/member/actions";

type Status = "attending" | "declined";

export function RsvpButtons({
  eventId,
  initial,
}: {
  eventId: string;
  initial: Status | null;
}) {
  const [status, setStatus] = useState<Status | null>(initial);
  const [pending, startTransition] = useTransition();

  function choose(next: Status) {
    if (next === status) return;
    const previous = status;
    setStatus(next); // optimistic
    startTransition(async () => {
      const result = await setRsvp({ eventId, status: next });
      if ("error" in result) {
        setStatus(previous);
        toast.add({
          title: "Couldn't save your response",
          description: result.error,
          type: "error",
        });
      }
    });
  }

  return (
    <div className="flex gap-2" role="group" aria-label="RSVP">
      <Button
        type="button"
        variant={status === "attending" ? "default" : "outline"}
        aria-pressed={status === "attending"}
        disabled={pending}
        onClick={() => choose("attending")}
        className="h-11 flex-1 sm:flex-none sm:px-5"
      >
        <Check className="size-4" />
        Attend
      </Button>
      <Button
        type="button"
        variant={status === "declined" ? "default" : "outline"}
        aria-pressed={status === "declined"}
        disabled={pending}
        onClick={() => choose("declined")}
        className="h-11 flex-1 sm:flex-none sm:px-5"
      >
        <X className="size-4" />
        Decline
      </Button>
    </div>
  );
}
