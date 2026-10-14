"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { reviewThankYou } from "@/lib/admin/thank-you-actions";
import type { ThankYouListItem } from "@/lib/admin/thank-you";

const STATUS_STYLE = {
  pending: "bg-[#fff5d9] text-[#b27a00]",
  approved: "bg-[#ddf8ef] text-[#08aa7a]",
  rejected: "bg-[#ffecef] text-[#f45b69]",
} as const;

export function ModerationList({ items }: { items: ThankYouListItem[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function review(id: string, decision: "approved" | "rejected") {
    setBusyId(id);
    startTransition(async () => {
      const result = await reviewThankYou({ id, decision });
      setBusyId(null);
      if ("error" in result) {
        toast.add({ title: "Couldn't update", description: result.error, type: "error" });
        return;
      }
      toast.add({
        title: decision === "approved" ? "Approved — sponsor can now see it" : "Rejected",
        type: "success",
      });
      router.refresh();
    });
  }

  const pending = items.filter((i) => i.status === "pending");
  const reviewed = items.filter((i) => i.status !== "pending");

  const renderItem = (m: ThankYouListItem, actions: boolean) => (
    <div key={m.id} className="border-b border-[#F1F3F6] py-4 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-tace-navy">
          {m.childName}
          <span className="font-normal text-tace-gray"> → {m.sponsorName ?? "no sponsor"}</span>
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold capitalize ${STATUS_STYLE[m.status]}`}>
          {m.status}
        </span>
        <span className="text-xs text-tace-gray/70">
          {new Date(m.created_at ?? "").toLocaleString("en-NG", {
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-tace-navy">
        {m.content}
      </p>
      {actions ? (
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            disabled={busyId === m.id}
            onClick={() => review(m.id, "approved")}
            className="h-9 bg-tace-green px-4 text-white hover:bg-tace-green/90"
          >
            <Check className="size-4" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busyId === m.id}
            onClick={() => review(m.id, "rejected")}
            className="h-9 px-4 text-tace-red hover:bg-tace-red/10"
          >
            <X className="size-4" />
            Reject
          </Button>
        </div>
      ) : null}
    </div>
  );

  const card = "rounded-[13px] border border-[#e5edf6] bg-white p-5 shadow-[0_8px_28px_rgba(20,55,95,0.07)]";

  return (
    <div className="flex flex-col gap-5">
      <section className={card}>
        <h2 className="font-heading text-base font-semibold text-tace-navy">
          Waiting for review ({pending.length})
        </h2>
        {pending.length > 0 ? (
          <div className="mt-2">{pending.map((m) => renderItem(m, true))}</div>
        ) : (
          <p className="mt-3 text-sm text-tace-gray/70">
            Nothing waiting. New thank-you messages from children will appear here.
          </p>
        )}
      </section>

      {reviewed.length > 0 ? (
        <section className={card}>
          <h2 className="font-heading text-base font-semibold text-tace-navy">
            Reviewed
          </h2>
          <div className="mt-2">{reviewed.map((m) => renderItem(m, false))}</div>
        </section>
      ) : null}
    </div>
  );
}
