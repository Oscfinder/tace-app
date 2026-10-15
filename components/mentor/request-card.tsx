"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
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
import { respondToMentorRequest } from "@/lib/mentor/actions";

export type RequestCardData = {
  matchId: string;
  firstName: string;
  age: number;
  classLevel: string | null;
  interests: string | null;
  aspirations: string | null;
  consentMentor: boolean;
  consentGuardian: boolean;
};

export function RequestCard({ request }: { request: RequestCardData }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function respond(decision: "accept" | "decline") {
    setBusy(true);
    setError(null);
    const result = await respondToMentorRequest({ matchId: request.matchId, decision });
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setConfirmDecline(false);
    toast.add({
      title:
        decision === "decline"
          ? "Request declined"
          : result.activated
            ? "Mentorship is now active 🎉"
            : "Thank you for accepting",
      description:
        decision === "accept" && !result.activated
          ? `We've asked ${request.firstName}'s guardian to accept too.`
          : undefined,
      type: "success",
    });
    router.refresh();
  }

  return (
    <article className="rounded-[18px] border border-m-line bg-white p-5 shadow-m-card">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="m-head text-xl font-extrabold text-m-ink">{request.firstName}</h3>
        <span className="text-sm text-m-muted">
          {request.age} years old{request.classLevel ? ` · ${request.classLevel}` : ""}
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-[#e5f6ff] p-4">
          <p className="text-[11px] font-bold tracking-wide text-[#0795e8] uppercase">Interests</p>
          <p className="mt-1 text-[15px] leading-relaxed text-m-ink">
            {request.interests || "Not shared yet"}
          </p>
        </div>
        <div className="rounded-xl bg-[#fff4dc] p-4">
          <p className="text-[11px] font-bold tracking-wide text-[#d99412] uppercase">
            Dreams for the future
          </p>
          <p className="mt-1 text-[15px] leading-relaxed text-m-ink">
            {request.aspirations || "Not shared yet"}
          </p>
        </div>
      </div>

      {request.consentMentor ? (
        <p className="mt-4 rounded-xl bg-[#e4fbf4] px-4 py-3 text-sm font-medium text-[#0a8f78]">
          You accepted. Waiting for {request.firstName}&apos;s guardian to accept too
          {request.consentGuardian ? " (they have)." : "."}
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            disabled={busy}
            onClick={() => respond("accept")}
            className="h-11 flex-1 bg-gradient-to-r from-m-blue to-m-blue2 text-base text-white sm:flex-none sm:px-8"
          >
            <Check className="size-4" />
            Accept
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              setError(null);
              setConfirmDecline(true);
            }}
            className="h-11 flex-1 text-base sm:flex-none sm:px-8"
          >
            <X className="size-4" />
            Decline
          </Button>
        </div>
      )}
      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-[#d63e69]">
          {error}
        </p>
      ) : null}

      <Dialog open={confirmDecline} onOpenChange={(o) => !busy && setConfirmDecline(o)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Decline this request?</DialogTitle>
            <DialogDescription>
              The TACE team will look for another mentor for {request.firstName}. This can&apos;t be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setConfirmDecline(false)}>
              Go back
            </Button>
            <Button
              disabled={busy}
              onClick={() => respond("decline")}
              className="bg-tace-red text-white hover:bg-tace-red/90"
            >
              {busy ? "Declining..." : "Yes, decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}
