"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guards";
import { sendEmail } from "@/lib/email/send";
import { getSiteUrl } from "@/lib/site-url";
import { logAudit } from "@/lib/admin/audit";
import { cleanupOrphanedApplicationPhotos } from "@/lib/storage/cleanup";
import { SETTING_KEYS } from "@/lib/site-settings";

type ActionResult = { error: string } | { success: true };

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

// Foundation details only. These are public, non-secret values: there is no
// field for a key, token or password, and the table only accepts these keys.
const settingsSchema = z.object({
  foundation_name: z.string().trim().min(1, "Enter the foundation name.").max(120),
  cac_number: z.string().trim().max(40),
  bank_name: z.string().trim().max(80),
  bank_account_name: z.string().trim().max(120),
  bank_account_number: z
    .string()
    .trim()
    .regex(/^(\d{10})?$/, "A Nigerian account number has 10 digits."),
  contact_email: z.union([z.literal(""), z.string().trim().email("Enter a valid email address.").max(200)]),
});

export async function saveSettings(
  input: Record<string, string>,
): Promise<ActionResult> {
  const session = await requireRole("admin");
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const supabase = await createClient();

  const { data: before } = await supabase.from("site_settings").select("key, value");
  const old = new Map((before ?? []).map((r) => [r.key, r.value]));
  const changed = SETTING_KEYS.filter((k) => (old.get(k) ?? "") !== parsed.data[k]);

  const { error } = await supabase.from("site_settings").upsert(
    SETTING_KEYS.map((key) => ({
      key,
      value: parsed.data[key],
      is_public: true,
      updated_by: session.user.id,
      updated_at: new Date().toISOString(),
    })),
  );
  if (error) return { error: error.message };

  // Key names only; the values themselves are not copied into the log.
  await logAudit(supabase, session.user.id, "settings_updated", "site_settings", null, {
    changed: changed.join(",") || "none",
  });

  revalidatePath("/dashboard/admin/settings");
  revalidatePath("/donate");
  revalidatePath("/dashboard/sponsor");
  revalidatePath("/dashboard/sponsor/giving");
  return { success: true };
}

const inviteSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the admin's full name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(200),
});

// The only way to create an admin. There is no public route for it: the caller
// must already be an active admin (checked here on the server), and the role is
// set by this action alone (the signup trigger never grants it).
export async function inviteAdmin(input: {
  fullName: string;
  email: string;
}): Promise<ActionResult> {
  const session = await requireRole("admin");
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { fullName, email } = parsed.data;

  const adminClient = createAdminClient();
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "member" },
  });
  if (createError || !created.user) {
    const exists = /already|registered|exists/i.test(createError?.message ?? "");
    return {
      error: exists
        ? "An account with that email already exists."
        : "Could not create the account. Please try again.",
    };
  }

  // RLS + the privilege guard allow an admin to set another profile's role.
  const supabase = await createClient();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "admin", status: "active", profile_completed: true })
    .eq("id", created.user.id);
  if (profileError) {
    // Don't leave a half-made account behind.
    await adminClient.auth.admin.deleteUser(created.user.id);
    return { error: "Could not make that account an admin. Nothing was created." };
  }

  await logAudit(supabase, session.user.id, "admin_invited", "profile", created.user.id);

  try {
    const { data: link } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${getSiteUrl()}/reset-password` },
    });
    const hashed = link?.properties?.hashed_token;
    const actionLink = hashed
      ? `${getSiteUrl()}/auth/confirm?token_hash=${encodeURIComponent(hashed)}&type=recovery`
      : null;
    await sendEmail({
      to: email,
      subject: "TACE Foundation — you have been added as an administrator",
      html: `<p>Hi ${escapeHtml(fullName)},</p>
<p>You have been added as an administrator of the TACE Foundation platform.</p>
<p>${
        actionLink
          ? `<a href="${actionLink}">Set your password and sign in</a>.`
          : `Go to <a href="${getSiteUrl()}/forgot-password">the sign-in page</a> and use "Forgot password" to set a password.`
      }</p>`,
    });
  } catch (err) {
    console.error("Admin invite email failed:", err);
  }

  revalidatePath("/dashboard/admin/settings");
  return { success: true };
}

export async function runPhotoCleanup(): Promise<
  { error: string } | { success: true; scanned: number; deleted: number }
> {
  const session = await requireRole("admin");
  try {
    const result = await cleanupOrphanedApplicationPhotos();
    const supabase = await createClient();
    await logAudit(supabase, session.user.id, "orphan_photos_cleaned", "storage", null, {
      scanned: result.scanned,
      deleted: result.deleted,
    });
    return { success: true, ...result };
  } catch (err) {
    console.error("Photo cleanup failed:", err);
    return { error: "The cleanup could not finish. Please try again." };
  }
}

// Lost phone? A DIFFERENT admin can clear an admin's authenticator so they can
// set up a new one at their next sign-in. An admin can't reset their own (that
// would defeat the second factor), and every reset is written to the audit log.
export async function resetAdminTwoFactor(profileId: string): Promise<ActionResult> {
  const session = await requireRole("admin");
  if (!z.string().uuid().safeParse(profileId).success) return { error: "Invalid request." };
  if (profileId === session.user.id) {
    return { error: "Ask another administrator to reset your two-factor sign-in." };
  }
  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("role", "admin")
    .maybeSingle();
  if (!target) return { error: "Administrator not found." };

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.mfa.listFactors({ userId: profileId });
  if (error) return { error: "Could not read their two-factor settings." };
  for (const factor of data.factors) {
    const { error: deleteError } = await adminClient.auth.admin.mfa.deleteFactor({
      id: factor.id,
      userId: profileId,
    });
    if (deleteError) return { error: "Could not reset their two-factor sign-in." };
  }
  await logAudit(supabase, session.user.id, "admin_2fa_reset", "profile", profileId, {
    factors_removed: data.factors.length,
  });
  revalidatePath("/dashboard/admin/settings");
  return { success: true };
}
