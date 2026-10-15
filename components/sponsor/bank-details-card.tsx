"use client";

import { useState } from "react";
import { Check, Copy, Landmark } from "lucide-react";

// Bank-transfer giving only (no card or Paystack flow yet). Details come from
// public env vars so they can change without a code change.
export function BankDetailsCard() {
  const number = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER;
  const bank = process.env.NEXT_PUBLIC_BANK_NAME;
  const accountName =
    process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "TACE Welfare Foundation";
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!number) return;
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the number is still on screen to copy by hand */
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-br from-[#087dbd] to-[#05a9e6] p-5 text-white shadow-[0_12px_25px_#068dd51c]">
      <span
        className="pointer-events-none absolute -top-4 right-4 text-[100px] leading-none text-white/10"
        aria-hidden
      >
        ✦
      </span>
      <div className="relative flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-white/20">
          <Landmark className="size-5" />
        </span>
        <div>
          <p className="text-[11px] font-bold tracking-[1.3px] text-[#bdeaff] uppercase">
            Give again
          </p>
          <h3 className="m-head text-lg font-extrabold">Bank transfer details</h3>
        </div>
      </div>

      {number ? (
        <dl className="relative mt-4 grid gap-2.5 text-sm">
          {bank ? (
            <div>
              <dt className="text-xs text-[#d9f3ff]">Bank</dt>
              <dd className="font-semibold">{bank}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs text-[#d9f3ff]">Account name</dt>
            <dd className="font-semibold">{accountName}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#d9f3ff]">Account number</dt>
            <dd className="flex items-center gap-3">
              <span className="m-head text-2xl font-extrabold tracking-wider">
                {number}
              </span>
              <button
                type="button"
                onClick={copy}
                className="flex min-h-11 items-center gap-1.5 rounded-lg bg-white/20 px-3 text-sm font-bold hover:bg-white/30"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </dd>
          </div>
        </dl>
      ) : (
        <p className="relative mt-4 text-sm text-[#eaf8ff]">
          Bank details will be shown here soon. Please contact the TACE team and
          they will share them with you.
        </p>
      )}

      <p className="relative mt-4 text-xs leading-relaxed text-[#d9f3ff]">
        After you transfer, an admin records your gift and sends a receipt. It
        can take a little while to appear on this page.
      </p>
    </div>
  );
}
