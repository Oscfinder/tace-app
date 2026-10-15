"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { updateSponsorProfile } from "@/lib/sponsor/actions";

const fieldClass =
  "block min-h-12 w-full rounded-xl border border-m-line bg-[#fbfcfe] px-3.5 py-3 text-base outline-none focus-visible:border-[#89d3f5] focus-visible:ring-4 focus-visible:ring-[#0ba6e820] disabled:opacity-60";

export function SponsorProfileForm({
  fullName,
  phone,
  email,
}: {
  fullName: string;
  phone: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [tel, setTel] = useState(phone);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateSponsorProfile({ full_name: name, phone: tel });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      toast.add({ title: "Profile updated", type: "success" });
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="full_name" className="text-sm font-bold text-m-ink">
          Full name
        </label>
        <input
          id="full_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          className={fieldClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-sm font-bold text-m-ink">
          Phone
        </label>
        <input
          id="phone"
          type="tel"
          value={tel}
          onChange={(e) => setTel(e.target.value)}
          autoComplete="tel"
          className={fieldClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-bold text-m-ink">
          Email
        </label>
        <input id="email" value={email} disabled readOnly className={fieldClass} />
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-[#d63e69]">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || name.trim().length < 2}
        className="min-h-12 rounded-xl bg-gradient-to-r from-m-blue to-m-blue2 px-6 text-base font-bold text-white shadow-[0_8px_18px_#009de832] disabled:opacity-50 sm:self-start"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
