"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

// Always resolves the same way, whether or not the address is registered (and
// even if Supabase errors, e.g. rate limiting) so the response can't be used
// to probe which emails have accounts. Errors are logged server-side only.
export async function requestPasswordReset(
  email: string,
): Promise<{ success: true }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: `${getSiteUrl()}/reset-password` },
  );
  if (error) console.error("Password reset request failed:", error.message);
  return { success: true };
}

export async function resetPassword(
  password: string,
): Promise<{ error: string } | never> {
  const supabase = await createClient();

  // Relies on a session already being present — established either by
  // app/auth/confirm/route.ts (token_hash flow, cookies set server-side)
  // or by the client calling supabase.auth.setSession() itself after
  // reading an #access_token=... fragment (see app/(auth)/reset-password).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "This link has expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  // End the recovery session so the user signs in with the new password.
  // (Left signed in, proxy.ts would bounce /login straight to the dashboard.)
  await supabase.auth.signOut();
  redirect("/login?reset=success");
}
