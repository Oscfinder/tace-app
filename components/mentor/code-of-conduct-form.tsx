"use client";

import { useState, useTransition } from "react";
import { acceptCodeOfConduct } from "@/lib/mentor/actions";

const fieldClass =
  "block min-h-12 w-full rounded-xl border border-m-line bg-[#fbfcfe] px-3.5 py-3 text-base outline-none focus-visible:border-[#89d3f5] focus-visible:ring-4 focus-visible:ring-[#0ba6e820]";

// A required tick and the typed full name. Nothing else in the mentor area is
// reachable until this is saved.
export function CodeOfConductForm({ fullName }: { fullName: string }) {
  const [agreed, setAgreed] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      // On success the action redirects; it only returns when something is wrong.
      const result = await acceptCodeOfConduct({ agreed, typedName });
      if (result && "error" in result) setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-m-line bg-white p-4 has-[:checked]:border-m-blue has-[:checked]:bg-[#f2faff]">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-m-blue"
        />
        <span className="text-[15px] leading-relaxed text-m-ink">
          I have read the code of conduct and I agree to follow it every time I mentor a child.
        </span>
      </label>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="typed-name" className="text-sm font-bold text-m-ink">
          Type your full name to sign
        </label>
        <input
          id="typed-name"
          value={typedName}
          onChange={(e) => setTypedName(e.target.value)}
          placeholder={fullName}
          autoComplete="name"
          aria-describedby={error ? "coc-error" : undefined}
          aria-invalid={error ? true : undefined}
          className={fieldClass}
        />
      </div>

      {error ? (
        <p id="coc-error" role="alert" className="text-sm font-medium text-[#d63e69]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !agreed || typedName.trim().length < 2}
        className="min-h-12 rounded-xl bg-gradient-to-r from-m-blue to-m-blue2 px-6 text-base font-bold text-white shadow-[0_8px_18px_#009de832] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Saving…" : "I agree and continue"}
      </button>
    </form>
  );
}
