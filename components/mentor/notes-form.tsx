"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { addMentoringNote } from "@/lib/mentor/actions";

const fieldClass =
  "block w-full rounded-xl border border-m-line bg-[#fbfcfe] px-3.5 py-3 text-base outline-none focus-visible:border-[#89d3f5] focus-visible:ring-4 focus-visible:ring-[#0ba6e820]";

// The date input's "max" and the default are today's date in the browser; the
// server also refuses a future date.
function today() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function NotesForm({ beneficiaryId }: { beneficiaryId: string }) {
  const router = useRouter();
  const [topics, setTopics] = useState("");
  const [improvements, setImprovements] = useState("");
  const [concerns, setConcerns] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [checkInDate, setCheckInDate] = useState(today);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await addMentoringNote({
      beneficiaryId,
      topics,
      improvements,
      concerns,
      nextSteps,
      checkInDate,
    });
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({ title: "Notes saved", type: "success" });
    setTopics("");
    setImprovements("");
    setConcerns("");
    setNextSteps("");
    router.refresh();
  }

  const label = "text-sm font-bold text-m-ink";

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="note-date" className={label}>
          Date of the check-in
        </label>
        <input
          id="note-date"
          type="date"
          max={today()}
          value={checkInDate}
          onChange={(e) => setCheckInDate(e.target.value)}
          className={`${fieldClass} min-h-12 sm:max-w-xs`}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="note-topics" className={label}>
          Topics discussed
        </label>
        <textarea id="note-topics" rows={3} maxLength={2000} value={topics} onChange={(e) => setTopics(e.target.value)} className={fieldClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="note-improvements" className={label}>
          Improvements you noticed <span className="font-normal text-m-muted">(optional)</span>
        </label>
        <textarea id="note-improvements" rows={2} maxLength={2000} value={improvements} onChange={(e) => setImprovements(e.target.value)} className={fieldClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="note-concerns" className={label}>
          Concerns <span className="font-normal text-m-muted">(optional)</span>
        </label>
        <textarea id="note-concerns" rows={2} maxLength={2000} value={concerns} onChange={(e) => setConcerns(e.target.value)} className={fieldClass} />
        <p className="text-xs text-m-muted">
          Notes are a record for the TACE team. If you are worried about a child&apos;s safety, use
          the &ldquo;Raise a concern&rdquo; button so we are told straight away.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="note-next" className={label}>
          Next steps <span className="font-normal text-m-muted">(optional)</span>
        </label>
        <textarea id="note-next" rows={2} maxLength={2000} value={nextSteps} onChange={(e) => setNextSteps(e.target.value)} className={fieldClass} />
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-[#d63e69]">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy || !topics.trim() || !checkInDate}
        className="min-h-12 rounded-xl bg-gradient-to-r from-m-blue to-m-blue2 px-6 text-base font-bold text-white shadow-[0_8px_18px_#009de832] disabled:opacity-50 sm:self-start"
      >
        {busy ? "Saving…" : "Save notes"}
      </button>
      <p className="text-xs text-m-muted">
        Saved notes can&apos;t be edited or deleted, so they stay a reliable record.
      </p>
    </form>
  );
}
