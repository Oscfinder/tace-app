"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      data-print-hide
      onClick={() => window.print()}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#d5e1ee] bg-white px-4 text-sm font-semibold text-tace-navy hover:bg-[#f3f8fd]"
    >
      <Printer className="size-4" />
      Print
    </button>
  );
}
