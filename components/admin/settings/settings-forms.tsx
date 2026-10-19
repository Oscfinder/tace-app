"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  inviteAdmin,
  resetAdminTwoFactor,
  runPhotoCleanup,
  saveSettings,
} from "@/lib/admin/settings-actions";
import type { FoundationSettings } from "@/lib/site-settings";

const input =
  "min-h-11 w-full rounded-lg border border-[#d5e1ee] bg-white px-3 text-sm text-tace-navy";

const FIELDS: {
  key: keyof FoundationSettings;
  label: string;
  hint?: string;
  inputMode?: "numeric" | "email";
}[] = [
  { key: "foundation_name", label: "Foundation name" },
  { key: "cac_number", label: "CAC registration number" },
  { key: "bank_name", label: "Bank name" },
  { key: "bank_account_name", label: "Account name" },
  {
    key: "bank_account_number",
    label: "Account number",
    hint: "10 digits. Shown to sponsors and on the donate page.",
    inputMode: "numeric",
  },
  { key: "contact_email", label: "Contact email", inputMode: "email" },
];

export function FoundationForm({ initial }: { initial: FoundationSettings }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const result = await saveSettings(values);
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({ title: "Settings saved", type: "success" });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
      {FIELDS.map((f) => (
        <label key={f.key} className="flex flex-col gap-1 text-sm font-semibold text-tace-navy">
          {f.label}
          <input
            className={input}
            value={values[f.key]}
            inputMode={f.inputMode}
            onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
          />
          {f.hint ? (
            <span className="text-xs font-normal text-tace-gray">{f.hint}</span>
          ) : null}
        </label>
      ))}
      <div className="sm:col-span-2">
        {error ? (
          <p role="alert" className="mb-3 text-sm font-semibold text-[#d93a49]">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={saving} className="min-h-11">
          {saving ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </form>
  );
}

export function InviteAdminForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const result = await inviteAdmin({ fullName, email });
    setSending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({ title: "Admin invited", description: "They have been emailed a link to set a password.", type: "success" });
    setFullName("");
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" noValidate>
      <label className="flex flex-col gap-1 text-sm font-semibold text-tace-navy">
        Full name
        <input className={input} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="off" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-tace-navy">
        Email
        <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
      </label>
      <Button type="submit" disabled={sending} className="min-h-11">
        {sending ? "Inviting..." : "Invite admin"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm font-semibold text-[#d93a49] sm:col-span-3">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export function PhotoCleanupButton() {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setMessage(null);
    const result = await runPhotoCleanup();
    setRunning(false);
    setMessage(
      "error" in result
        ? result.error
        : result.deleted === 0
          ? "Nothing to clean up."
          : `Removed ${result.deleted} unused photo${result.deleted === 1 ? "" : "s"}.`,
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="outline" onClick={run} disabled={running} className="min-h-11">
        {running ? "Cleaning..." : "Clean up now"}
      </Button>
      {message ? (
        <p role="status" className="text-sm text-tace-gray">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export function ResetTwoFactorButton({ profileId, name }: { profileId: string; name: string }) {
  const [busy, setBusy] = useState(false);

  async function reset() {
    if (!window.confirm(`Reset two-factor sign-in for ${name}? They will set up a new authenticator at their next sign-in.`)) {
      return;
    }
    setBusy(true);
    const result = await resetAdminTwoFactor(profileId);
    setBusy(false);
    toast.add(
      "error" in result
        ? { title: "Couldn't reset", description: result.error, type: "error" }
        : { title: "Two-factor reset", description: `${name} will set up a new authenticator at next sign-in.`, type: "success" },
    );
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={reset} disabled={busy} className="min-h-9">
      {busy ? "Resetting..." : "Reset 2FA"}
    </Button>
  );
}
