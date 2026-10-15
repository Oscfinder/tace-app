"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck, X } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { respondToGuardianRequest } from "@/lib/beneficiary/mentor-actions";

export type MentorRequestData = {
  matchId: string;
  mentorName: string;
  profession: string | null;
  track: "career" | "tech" | null;
  mentorAccepted: boolean;
  guardianAccepted: boolean;
};

const TRACKS = { career: "Career guidance", tech: "Technology skills" } as const;

export function MentorRequestCard({
  request,
  childName,
}: {
  request: MentorRequestData;
  childName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function respond(decision: "accept" | "decline") {
    setBusy(true);
    setError(null);
    const result = await respondToGuardianRequest({ matchId: request.matchId, decision });
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({
      title:
        decision === "decline"
          ? "Request declined"
          : result.activated
            ? "Your mentorship is now active 🎉"
            : "Thank you for accepting",
      type: "success",
    });
    setConfirmDecline(false);
    router.refresh();
  }

  return (
    <section
      aria-labelledby="mentor-request-heading"
      className="rounded-[22px] border-2 border-[#bfe6fb] bg-gradient-to-br from-[#f2faff] to-white p-5 shadow-m-card"
    >
      <p className="text-[11px] font-bold tracking-[1.3px] text-m-blue uppercase">Mentor request</p>
      <h2 id="mentor-request-heading" className="m-head mt-1 text-xl font-extrabold text-m-ink">
        A mentor would like to guide {childName}
      </h2>

      <div className="mt-3 rounded-2xl bg-white p-4 ring-1 ring-m-line">
        <p className="m-head text-lg font-extrabold text-m-ink">{request.mentorName}</p>
        {request.profession ? (
          <p className="text-[15px] text-m-muted">{request.profession}</p>
        ) : null}
        {request.track ? (
          <p className="mt-1 text-sm font-semibold text-[#7759e8]">{TRACKS[request.track]}</p>
        ) : null}
        <p className="mt-2 text-sm text-m-muted">
          {request.mentorAccepted
            ? "The mentor has already said yes."
            : "The mentor is also being asked, and must say yes too."}
        </p>
      </div>

      <div className="mt-4 flex gap-3 rounded-2xl bg-[#f4f8fd] p-4">
        <ShieldCheck className="mt-0.5 size-6 shrink-0 text-m-blue" aria-hidden />
        <div className="text-[15px] leading-relaxed text-[#4d6584]">
          <p className="font-bold text-m-ink">How messaging is kept safe</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Messages on TACE are visible to TACE staff to keep children safe.</li>
            <li>Mentors can&apos;t share phone numbers, emails or links, and messages can&apos;t be deleted.</li>
            <li>TACE can pause or end the mentorship at any time, and you can too.</li>
          </ul>
        </div>
      </div>

      {request.guardianAccepted ? (
        <p className="mt-4 rounded-xl bg-[#e4fbf4] px-4 py-3 text-[15px] font-medium text-[#0a8f78]">
          You have accepted. We&apos;re waiting for the mentor to say yes too.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={busy}
            onClick={() => respond("accept")}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-m-blue to-m-blue2 text-base font-bold text-white shadow-[0_8px_18px_#009de832] disabled:opacity-60 sm:flex-none sm:px-10"
          >
            <Check className="size-5" />
            Accept
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setError(null);
              setConfirmDecline(true);
            }}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-m-line bg-white text-base font-bold text-[#35597d] disabled:opacity-60 sm:flex-none sm:px-10"
          >
            <X className="size-5" />
            Decline
          </button>
        </div>
      )}

      {confirmDecline ? (
        <div
          role="alertdialog"
          aria-label="Confirm decline"
          className="mt-3 rounded-2xl bg-[#fff1f4] p-4"
        >
          <p className="text-[15px] font-semibold text-m-ink">
            Decline this mentor? The TACE team will be told and can look for someone else.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => respond("decline")}
              className="min-h-11 rounded-xl bg-[#ec4f7b] px-5 text-base font-bold text-white disabled:opacity-60"
            >
              {busy ? "Declining…" : "Yes, decline"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmDecline(false)}
              className="min-h-11 rounded-xl border border-m-line bg-white px-5 text-base font-bold text-[#35597d]"
            >
              Go back
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-base font-medium text-[#d63e69]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
