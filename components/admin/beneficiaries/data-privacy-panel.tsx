"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { eraseChildData } from "@/lib/admin/data-requests-actions";

// Data protection requests for one child: a copy of everything held, or deletion.
export function DataPrivacyPanel({
  beneficiaryId,
  taceId,
}: {
  beneficiaryId: string;
  taceId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [includeSafeguarding, setIncludeSafeguarding] = useState(false);
  const [needsDecision, setNeedsDecision] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ warnings: string[] } | null>(null);

  async function erase() {
    setBusy(true);
    setError(null);
    const result = await eraseChildData({
      beneficiaryId,
      confirmTaceId: typed,
      includeSafeguarding,
    });
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      setNeedsDecision(Boolean(result.needsSafeguardingDecision));
      return;
    }
    setDone({ warnings: result.warnings });
  }

  if (done) {
    return (
      <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-5" role="status">
        <h3 className="font-heading text-sm font-semibold text-tace-navy">Data deleted</h3>
        <p className="mt-2 text-sm text-tace-gray">
          Everything held about {taceId} has been removed and the action is recorded in the audit log.
        </p>
        {done.warnings.length > 0 ? (
          <ul className="mt-3 list-disc pl-5 text-sm text-[#b42318]">
            {done.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : null}
        <Button className="mt-4 min-h-11" onClick={() => router.push("/dashboard/admin/beneficiaries")}>
          Back to beneficiaries
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-5">
      <h3 className="font-heading text-sm font-semibold text-tace-navy">Data protection requests</h3>
      <p className="mt-1 text-sm text-tace-gray">
        If the family asks for a copy of the data we hold, or for it to be deleted, use these. Both are recorded in the audit log.
      </p>

      <a
        href={`/dashboard/admin/beneficiaries/${beneficiaryId}/export`}
        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#d5e1ee] bg-white px-4 text-sm font-semibold text-tace-navy hover:bg-[#f3f8fd]"
      >
        <Download className="size-4" />
        Download all data (JSON)
      </a>

      <div className="mt-5 border-t border-[#ECEFF3] pt-4">
        {!open ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(true)}
            className="min-h-11 border-[#f1b0b7] text-[#b42318] hover:bg-[#fff5f5]"
          >
            <ShieldAlert className="size-4" />
            Delete all data for this child…
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-tace-navy">
              This permanently removes the child&apos;s record, application, mentor messages, notes, photos and documents, and their sign-in account. <b>It cannot be undone.</b> Donation records are kept with the link to the child removed, and any story about them is unpublished.
            </p>
            <label className="flex flex-col gap-1 text-sm font-semibold text-tace-navy">
              Type the child&apos;s TACE ID ({taceId}) to confirm
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                className="min-h-11 rounded-lg border border-[#d5e1ee] px-3 text-sm font-normal"
              />
            </label>
            <label className="flex items-start gap-2 text-sm text-tace-navy">
              <input
                type="checkbox"
                checked={includeSafeguarding}
                onChange={(e) => setIncludeSafeguarding(e.target.checked)}
                className="mt-1 size-5"
              />
              <span>
                Also delete safeguarding concerns about this child.
                {needsDecision ? <b> Required, because some exist.</b> : null}
                <span className="block text-xs text-tace-gray">
                  Safeguarding records may have to be kept by law. Ask the legal trustee first.
                </span>
              </span>
            </label>
            {error ? (
              <p role="alert" className="text-sm font-semibold text-[#d93a49]">
                {error}
              </p>
            ) : null}
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={erase}
                disabled={busy || typed.trim().length === 0}
                className="min-h-11 bg-[#d93a49] text-white hover:bg-[#b42318]"
              >
                {busy ? "Deleting…" : "Delete permanently"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy} className="min-h-11">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
