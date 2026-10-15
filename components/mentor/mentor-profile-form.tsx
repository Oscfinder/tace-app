"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { updateMentorProfile } from "@/lib/mentor/actions";
import { MENTOR_AVAILABILITY } from "@/lib/validations/auth";

const LABELS: Record<(typeof MENTOR_AVAILABILITY)[number], string> = {
  weekdays: "Weekdays",
  weekends: "Weekends",
  both: "Both",
  flexible: "Flexible",
};

const fieldClass =
  "block min-h-12 w-full rounded-xl border border-m-line bg-[#fbfcfe] px-3.5 py-3 text-base outline-none focus-visible:border-[#89d3f5] focus-visible:ring-4 focus-visible:ring-[#0ba6e820] disabled:opacity-60";

export function MentorProfileForm({
  fullName,
  phone,
  email,
  availability,
  expertise,
}: {
  fullName: string;
  phone: string;
  email: string;
  availability: string | null;
  expertise: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [tel, setTel] = useState(phone);
  const [avail, setAvail] = useState(availability ?? "");
  const [exp, setExp] = useState(expertise);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await updateMentorProfile({
      fullName: name,
      phone: tel,
      availability: avail || null,
      expertise: exp,
    });
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({ title: "Profile updated", type: "success" });
    router.refresh();
  }

  const label = "text-sm font-bold text-m-ink";

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="full_name" className={label}>Full name</label>
        <input id="full_name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={fieldClass} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className={label}>Phone</label>
          <input id="phone" type="tel" value={tel} onChange={(e) => setTel(e.target.value)} autoComplete="tel" className={fieldClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={label}>Email</label>
          <input id="email" value={email} disabled readOnly className={fieldClass} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="availability" className={label}>Availability</label>
          <select id="availability" value={avail} onChange={(e) => setAvail(e.target.value)} className={fieldClass}>
            <option value="">Not set</option>
            {MENTOR_AVAILABILITY.map((a) => (
              <option key={a} value={a}>{LABELS[a]}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="expertise" className={label}>Area of expertise</label>
          <input id="expertise" value={exp} onChange={(e) => setExp(e.target.value)} maxLength={300} className={fieldClass} />
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-[#d63e69]">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={busy || name.trim().length < 2}
        className="min-h-12 rounded-xl bg-gradient-to-r from-m-blue to-m-blue2 px-6 text-base font-bold text-white shadow-[0_8px_18px_#009de832] disabled:opacity-50 sm:self-start"
      >
        {busy ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
