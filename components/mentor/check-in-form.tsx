"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { scheduleCheckIn } from "@/lib/mentor/actions";

const fieldClass =
  "block min-h-12 w-full rounded-xl border border-m-line bg-[#fbfcfe] px-3.5 py-3 text-base outline-none focus-visible:border-[#89d3f5] focus-visible:ring-4 focus-visible:ring-[#0ba6e820]";

export function CheckInForm({
  beneficiaryId,
  current,
  childName,
}: {
  beneficiaryId: string;
  /** ISO timestamp of the scheduled check-in, if any. */
  current: string | null;
  childName: string;
}) {
  const router = useRouter();
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(iso: string | null) {
    setBusy(true);
    setError(null);
    const result = await scheduleCheckIn({ beneficiaryId, when: iso });
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({
      title: iso ? "Check-in scheduled" : "Check-in removed",
      description: iso ? `${childName}'s guardian has been notified.` : undefined,
      type: "success",
    });
    setWhen("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3 rounded-2xl bg-[#f0ebff] p-4">
        <CalendarClock className="mt-0.5 size-6 shrink-0 text-[#7759e8]" aria-hidden />
        <div>
          <p className="text-xs font-bold tracking-wide text-[#7759e8] uppercase">
            Next check-in
          </p>
          <p className="m-head text-lg font-extrabold text-m-ink">
            {current
              ? new Date(current).toLocaleString("en-NG", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "Not scheduled yet"}
          </p>
        </div>
      </div>

      <label htmlFor="check-in-when" className="text-sm font-bold text-m-ink">
        {current ? "Change the date and time" : "Schedule the next check-in"}
      </label>
      <input
        id="check-in-when"
        type="datetime-local"
        value={when}
        onChange={(e) => setWhen(e.target.value)}
        className={fieldClass}
      />
      {error ? (
        <p role="alert" className="text-sm font-medium text-[#d63e69]">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !when}
          onClick={() => save(new Date(when).toISOString())}
          className="min-h-12 rounded-xl bg-gradient-to-r from-m-blue to-m-blue2 px-6 text-base font-bold text-white shadow-[0_8px_18px_#009de832] disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save check-in"}
        </button>
        {current ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => save(null)}
            className="min-h-12 rounded-xl border border-m-line bg-white px-5 text-base font-bold text-[#35597d] disabled:opacity-50"
          >
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}
