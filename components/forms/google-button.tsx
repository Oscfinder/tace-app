"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// `intent` is only a hint for the "Complete your profile" step (which role's
// form to pre-select). It grants nothing — the server action decides.
export function GoogleButton({
  label,
  intent,
}: {
  label: string;
  intent?: "member" | "sponsor" | "mentor";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
    ).replace(/\/+$/, "");
    const redirectTo = `${siteUrl}/auth/callback${intent ? `?intent=${intent}` : ""}`;

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    // On success the browser is already navigating to Google.
    if (error) {
      setError("Couldn't start Google sign-in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex h-14 w-full items-center justify-center gap-2.5 rounded-[13px] border border-[#d5e1ee] bg-white text-[15px] font-bold text-tace-navy transition-colors hover:bg-[#f7faff] disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
          <path
            fill="#4285F4"
            d="M23.52 12.27c0-.8-.07-1.57-.2-2.31H12v4.38h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3.01h3.49c2.04-1.88 3.22-4.65 3.22-7.7z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.49-3.01c-.97.65-2.21 1.03-4.45 1.03-3.42 0-6.32-2.31-7.36-5.42H1.02v3.11C2.98 21.3 7.13 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M4.64 13.7a7.2 7.2 0 0 1 0-4.6V5.99H1.02a11.98 11.98 0 0 0 0 10.82l3.62-3.1z"
          />
          <path
            fill="#EA4335"
            d="M12 4.77c1.76 0 3.34.6 4.58 1.78l3.1-3.1C17.94 1.6 15.24.5 12 .5 7.13.5 2.98 3.2 1.02 7.18l3.62 2.82c1.04-3.11 3.94-5.23 7.36-5.23z"
          />
        </svg>
        {loading ? "Redirecting..." : label}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-center text-xs text-tace-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}
