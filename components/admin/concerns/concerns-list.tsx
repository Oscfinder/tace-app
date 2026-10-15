"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { setConcernStatus } from "@/lib/admin/concerns-actions";
import type { ConcernItem } from "@/lib/admin/concerns";

const STATUS_STYLE = {
  open: "bg-[#ffecef] text-[#f45b69]",
  reviewing: "bg-[#fff5d9] text-[#b27a00]",
  closed: "bg-[#ddf8ef] text-[#08aa7a]",
} as const;
const STATUS_LABEL = { open: "Open", reviewing: "Being reviewed", closed: "Closed" } as const;

const card =
  "rounded-[13px] border border-[#e5edf6] bg-white p-5 shadow-[0_8px_28px_rgba(20,55,95,0.07)]";

export function ConcernsList({ items }: { items: ConcernItem[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function change(id: string, status: "open" | "reviewing" | "closed") {
    setBusyId(id);
    const result = await setConcernStatus({ id, status });
    setBusyId(null);
    if ("error" in result) {
      toast.add({ title: "Couldn't update", description: result.error, type: "error" });
      return;
    }
    toast.add({
      title: status === "closed" ? "Concern closed" : status === "reviewing" ? "Marked as being reviewed" : "Reopened",
      type: "success",
    });
    router.refresh();
  }

  const active = items.filter((i) => i.status !== "closed");
  const closed = items.filter((i) => i.status === "closed");

  const render = (c: ConcernItem) => (
    <article key={c.id} className="border-b border-[#F1F3F6] py-4 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[c.status]}`}>
          {STATUS_LABEL[c.status]}
        </span>
        <Link
          href={`/dashboard/admin/beneficiaries/${c.childId}`}
          className="text-sm font-semibold text-tace-blue hover:underline"
        >
          About {c.childName}
        </Link>
        <span className="text-xs text-tace-gray">
          {new Date(c.created_at ?? "").toLocaleString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </div>
      <p className="mt-1 text-xs text-tace-gray">
        Raised by {c.raisedByName} ({c.raisedByRole})
        {c.mentorName && c.raisedByName !== c.mentorName ? ` · Mentor: ${c.mentorName}` : ""}
      </p>
      <p className="mt-2 rounded-lg bg-tace-lgray p-3 text-sm leading-relaxed whitespace-pre-line text-tace-navy">
        {c.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {c.status === "open" ? (
          <Button size="sm" variant="outline" disabled={busyId === c.id} onClick={() => change(c.id, "reviewing")} className="h-9">
            Start reviewing
          </Button>
        ) : null}
        {c.status !== "closed" ? (
          <Button
            size="sm"
            disabled={busyId === c.id}
            onClick={() => change(c.id, "closed")}
            className="h-9 bg-tace-green text-white hover:bg-tace-green/90"
          >
            Close
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled={busyId === c.id} onClick={() => change(c.id, "open")} className="h-9">
            Reopen
          </Button>
        )}
      </div>
    </article>
  );

  return (
    <div className="flex flex-col gap-5">
      <section className={card}>
        <h2 className="font-heading text-base font-semibold text-tace-navy">
          Needs attention ({active.length})
        </h2>
        {active.length > 0 ? (
          <div className="mt-2">{active.map(render)}</div>
        ) : (
          <p className="mt-3 text-sm text-tace-gray/70">
            No open concerns. Anything a mentor, sponsor or child raises will appear here and
            notify you.
          </p>
        )}
      </section>
      {closed.length > 0 ? (
        <section className={card}>
          <h2 className="font-heading text-base font-semibold text-tace-navy">
            Closed ({closed.length})
          </h2>
          <div className="mt-2">{closed.map(render)}</div>
        </section>
      ) : null}
    </div>
  );
}
