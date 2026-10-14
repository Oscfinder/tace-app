"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guards";
import { sendEmail } from "@/lib/email/send";
import { getSiteUrl } from "@/lib/site-url";
import { movePhotoToBeneficiary } from "@/lib/storage/move-photo";
import type { Database } from "@/types/database";

type ActionResult = { error: string } | { success: true };

const VALID_GENDERS = ["male", "female", "other"];
const VALID_EDU_STATUSES = ["in_school", "out_of_school", "never_attended"];

export async function saveAdminNotes(
  applicationId: string,
  notes: string,
): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("applications")
    .update({ admin_notes: notes })
    .eq("id", applicationId);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/admin/applications/${applicationId}`);
  return { success: true };
}

export async function approveApplication(input: {
  applicationId: string;
  currentStage: Database["public"]["Tables"]["beneficiaries"]["Row"]["current_stage"];
  mentorId: string | null;
}): Promise<ActionResult> {
  const session = await requireRole("admin");
  const supabase = await createClient();

  const { data: application, error: fetchError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", input.applicationId)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!application) return { error: "Application not found." };
  if (application.status !== "pending" && application.status !== "flagged") {
    return { error: "This application has already been reviewed." };
  }

  const loginEmail =
    application.applicant_type === "self"
      ? application.child_email
      : application.guardian_email;

  if (!loginEmail) {
    return {
      error:
        application.applicant_type === "self"
          ? "This application has no child email on file — can't create a login."
          : "This application has no guardian email on file — can't create a login.",
    };
  }

  const admin = createAdminClient();

  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email: loginEmail,
      email_confirm: true,
      user_metadata: {
        full_name: `${application.child_first_name} ${application.child_last_name}`,
        role: "beneficiary",
      },
    });

  if (authError || !authData.user) {
    return {
      error: authError?.message ?? "Could not create the beneficiary account.",
    };
  }

  const gender = VALID_GENDERS.includes(application.child_gender ?? "")
    ? (application.child_gender as "male" | "female" | "other")
    : null;
  const eduStatus = VALID_EDU_STATUSES.includes(application.edu_status ?? "")
    ? (application.edu_status as
        "in_school" | "out_of_school" | "never_attended")
    : null;

  const { data: beneficiary, error: insertError } = await supabase
    .from("beneficiaries")
    .insert({
      profile_id: authData.user.id,
      application_id: application.id,
      first_name: application.child_first_name,
      last_name: application.child_last_name,
      date_of_birth: application.child_dob,
      gender,
      state_of_origin: application.child_state,
      address: application.child_address,
      phone: application.child_phone,
      email: application.child_email,
      photo_url: application.child_photo_url,
      guardian_name: application.guardian_name,
      guardian_rel: application.guardian_relationship,
      guardian_phone: application.guardian_phone,
      guardian_email: application.guardian_email,
      edu_status: eduStatus,
      school_name: application.school_name,
      class_level: application.class_level,
      living_situation: application.living_situation,
      household_income: application.household_income,
      challenges: application.challenges,
      support_needed: application.support_types,
      support_description: application.support_description,
      interests: application.interests,
      aspirations: application.aspirations,
      talents: application.talents,
      health_conditions: application.health_conditions,
      disabilities: application.disabilities,
      current_stage: input.currentStage,
      stage_updated_at: new Date().toISOString(),
    })
    .select("id, tace_id")
    .single();

  if (insertError || !beneficiary) {
    return {
      error:
        insertError?.message ??
        "Could not create the beneficiary record after creating the account.",
    };
  }

  // Move the application photo to {beneficiary_id}/photo.ext so it follows the
  // storage-policy convention, then point the beneficiary at the new path. If
  // the move fails the beneficiary keeps the original path (nothing is lost).
  const movedPhoto = await movePhotoToBeneficiary(
    application.child_photo_url,
    beneficiary.id,
  );
  if (movedPhoto) {
    await supabase
      .from("beneficiaries")
      .update({ photo_url: movedPhoto })
      .eq("id", beneficiary.id);
  }

  // Mirrors Ticket 2C's mentor-assignment rule: a mentor pick here creates a
  // pending-consent match, never sets beneficiaries.mentor_id directly.
  if (input.mentorId) {
    await supabase.from("mentorship_matches").insert({
      mentor_id: input.mentorId,
      beneficiary_id: beneficiary.id,
      status: "pending_consent",
    });
  }

  // handle_new_user() always creates the profile as status='pending' — that
  // trigger has no way to know this particular signup was an admin-approved
  // beneficiary account rather than a self-service signup awaiting review.
  // Flip it to active here, or the new login gets bounced to /pending by
  // proxy.ts forever. profiles_admin_update_all + the admin-exempt
  // privilege-escalation trigger both allow this from the regular client.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ status: "active", role: "beneficiary" })
    .eq("id", authData.user.id);

  if (profileError) return { error: profileError.message };

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      status: "approved",
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.applicationId);

  if (updateError) return { error: updateError.message };

  try {
    // No password was set on createUser, so the account needs a recovery
    // link to let the guardian (or the child, for a 'self' application) set
    // one and sign in for the first time.
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "recovery",
        email: loginEmail,
        options: { redirectTo: `${getSiteUrl()}/reset-password` },
      });
    if (linkError) {
      console.error("Password-setup link generation failed:", linkError);
    }
    // Point at our own /auth/confirm (same as the email templates) so it
    // verifies the token server-side and lands on /reset-password with a
    // session cookie — no dependence on Supabase's URL-fragment redirect.
    const hashedToken = linkData?.properties?.hashed_token;
    const actionLink = hashedToken
      ? `${getSiteUrl()}/auth/confirm?token_hash=${encodeURIComponent(hashedToken)}&type=recovery`
      : undefined;

    await sendEmail({
      to: loginEmail,
      subject: "TACE Foundation — Your application has been approved",
      html: `<p>Hi ${application.guardian_name ?? application.child_first_name},</p>
<p>${application.child_first_name}'s application to TACE Welfare Foundation has been approved. Their TACE ID is <strong>${beneficiary.tace_id}</strong>.</p>
<p>An account has been created using this email address.${
        actionLink
          ? ` <a href="${actionLink}">Click here to set your password and sign in</a>.`
          : " You'll receive a separate link to set a password and sign in."
      }</p>`,
    });
  } catch (err) {
    console.error("Approval email failed to send:", err);
  }

  revalidatePath("/dashboard/admin/applications");
  revalidatePath(`/dashboard/admin/applications/${input.applicationId}`);
  return { success: true };
}

export async function rejectApplication(input: {
  applicationId: string;
  reason: string;
}): Promise<ActionResult> {
  const session = await requireRole("admin");
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("applications")
    .select("status, guardian_email, child_email, child_first_name")
    .eq("id", input.applicationId)
    .maybeSingle();

  if (!application) return { error: "Application not found." };
  if (application.status !== "pending" && application.status !== "flagged") {
    return { error: "This application has already been reviewed." };
  }

  const { error } = await supabase
    .from("applications")
    .update({
      status: "rejected",
      admin_notes: input.reason,
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.applicationId);

  if (error) return { error: error.message };

  const notifyEmail = application.guardian_email ?? application.child_email;
  if (notifyEmail) {
    try {
      await sendEmail({
        to: notifyEmail,
        subject: "TACE Foundation — Update on your application",
        html: `<p>Thank you for applying to TACE Welfare Foundation on behalf of ${application.child_first_name}.</p>
<p>After review, we're not able to proceed with this application at this time. ${input.reason}</p>
<p>You're welcome to apply again in the future.</p>`,
      });
    } catch (err) {
      console.error("Rejection email failed to send:", err);
    }
  }

  revalidatePath("/dashboard/admin/applications");
  revalidatePath(`/dashboard/admin/applications/${input.applicationId}`);
  return { success: true };
}

export async function flagApplication(input: {
  applicationId: string;
  note: string;
}): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("applications")
    .select("status, admin_notes")
    .eq("id", input.applicationId)
    .maybeSingle();

  if (!application) return { error: "Application not found." };
  if (application.status !== "pending") {
    return { error: "This application has already been reviewed." };
  }

  const appendedNotes = input.note
    ? [application.admin_notes, `[Flagged] ${input.note}`]
        .filter(Boolean)
        .join("\n\n")
    : application.admin_notes;

  const { error } = await supabase
    .from("applications")
    .update({ status: "flagged", admin_notes: appendedNotes })
    .eq("id", input.applicationId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/applications");
  revalidatePath(`/dashboard/admin/applications/${input.applicationId}`);
  return { success: true };
}
