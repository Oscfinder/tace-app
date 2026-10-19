"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/forms/auth-card";
import { FormError } from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Mode =
  | { kind: "loading" }
  | { kind: "challenge"; factorId: string }
  | { kind: "enroll"; factorId: string; qr: string; secret: string }
  | { kind: "error"; message: string };

// Authenticator-app (TOTP) two-factor for admins, using Supabase Auth's own MFA.
// The shared secret is created and kept by Supabase; this page only shows it
// once during setup and never stores it.
export function TwoFactorForm() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>({ kind: "loading" });
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (cancelled) return;
      if (listError) {
        setMode({ kind: "error", message: "We couldn't load two-factor settings. Please refresh the page." });
        return;
      }
      const verified = factors.totp[0]; // verified TOTP factors only
      if (verified) {
        setMode({ kind: "challenge", factorId: verified.id });
        return;
      }
      // Drop any half-finished setup from an earlier attempt before starting a new one.
      for (const stale of factors.all.filter((f) => f.factor_type === "totp" && f.status !== "verified")) {
        await supabase.auth.mfa.unenroll({ factorId: stale.id });
      }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator app",
      });
      if (cancelled) return;
      if (enrollError || !data) {
        setMode({ kind: "error", message: "We couldn't start two-factor setup. Please refresh the page." });
        return;
      }
      setMode({ kind: "enroll", factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    }
    start();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode.kind !== "challenge" && mode.kind !== "enroll") return;
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: mode.factorId,
      code,
    });
    if (verifyError) {
      setBusy(false);
      setCode("");
      setError("That code didn't work. Check the code and try again.");
      return;
    }
    // The session is now upgraded; a full navigation lets the server see it.
    router.replace("/dashboard/admin");
    router.refresh();
  }

  const title = mode.kind === "enroll" ? "Set up two-factor sign-in" : "Two-factor sign-in";

  return (
    <AuthCard
      title={title}
      description={
        mode.kind === "enroll"
          ? "Administrators must use an authenticator app. Scan the code below, then enter the 6-digit code it shows."
          : "Enter the 6-digit code from your authenticator app."
      }
    >
      {mode.kind === "loading" ? <p className="text-sm text-tace-gray">Loading…</p> : null}
      {mode.kind === "error" ? <FormError message={mode.message} /> : null}

      {mode.kind === "enroll" ? (
        <div className="mb-5 flex flex-col items-center gap-3">
          {/* Supabase returns the QR as an SVG data URI. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mode.qr} alt="QR code to add TACE Foundation to your authenticator app" width={180} height={180} />
          <p className="text-center text-xs text-tace-gray">
            Can&apos;t scan it? Enter this key in your app instead:
            <br />
            <code className="font-mono text-sm break-all text-tace-navy">{mode.secret}</code>
          </p>
        </div>
      ) : null}

      {mode.kind === "enroll" || mode.kind === "challenge" ? (
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          {error ? <FormError message={error} /> : null}
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-tace-navy">
            6-digit code
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="min-h-12 rounded-lg border border-[#d5e1ee] px-3 text-center text-xl tracking-[0.4em]"
              autoFocus
            />
          </label>
          <Button type="submit" disabled={busy} className="min-h-12">
            {busy ? "Checking…" : mode.kind === "enroll" ? "Turn on two-factor" : "Verify"}
          </Button>
        </form>
      ) : null}
    </AuthCard>
  );
}
