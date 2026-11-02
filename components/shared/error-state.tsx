"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { reportClientError } from "@/lib/monitoring/report-client-error";

// The screen shown when something breaks. Kind words, a retry button and a way
// out. It never shows the error text or a stack trace: in production Next.js
// hides server error details from the browser, and this component does not print
// the message in any mode. The short reference code lets support find the
// matching entry in the server logs.
export function ErrorState({
  error,
  retry,
  scope,
  homeHref,
  homeLabel,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  scope: string;
  homeHref: string;
  homeLabel: string;
}) {
  useEffect(() => {
    reportClientError(error, scope);
  }, [error, scope]);

  return (
    <div
      role="alert"
      className="mx-auto my-16 flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-[#e5edf6] bg-white p-8 text-center shadow-[0_8px_28px_rgba(20,55,95,0.07)]"
    >
      <span className="grid size-14 place-items-center rounded-full bg-[#fff5d9] text-2xl" aria-hidden>
        🛠️
      </span>
      <h1 className="font-heading text-xl font-bold text-[#102a4d]">Something went wrong</h1>
      <p className="text-sm leading-relaxed text-[#4a607f]">
        We&apos;re sorry. That didn&apos;t work, and it is not your fault. Please try again. If it keeps happening, come back in a little while.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1597d1] px-5 text-sm font-semibold text-white hover:opacity-90"
        >
          <RefreshCw className="size-4" aria-hidden />
          Try again
        </button>
        <Link
          href={homeHref}
          className="inline-flex min-h-11 items-center rounded-lg border border-[#d5e1ee] px-5 text-sm font-semibold text-[#102a4d] hover:bg-[#f3f8fd]"
        >
          {homeLabel}
        </Link>
      </div>
      {error.digest ? <p className="text-xs text-[#7889a4]">Reference: {error.digest}</p> : null}
    </div>
  );
}
