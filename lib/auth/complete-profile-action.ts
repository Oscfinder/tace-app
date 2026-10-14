"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  completeProfileSchema,
  type CompleteProfileInput,
} from "@/lib/validations/auth";

// Finishes a Google sign-up. The profile row already exists (created by
// handle_new_user() as role 'member', status 'pending', profile_completed
// false). Users can't change their own role (DB trigger), so this runs with
// the service-role client — which is why it is strict:
//   • only member / sponsor / mentor are representable in the Zod schema, so
//     admin and beneficiary can never be requested, whatever the client sends;
//   • it only works while profile_completed is false, i.e. once, right after
//     OAuth signup — an existing user can't use it to change role later;
//   • status is never written, so the account stays 'pending' for admin review.
export async function completeProfile(
  input: CompleteProfileInput,
): Promise<{ error: string } | never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session has expired. Please sign in again." };

  const parsed = completeProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }
  const data = parsed.data;

  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_completed")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "Could not load your profile. Please try again." };
  if (profile.profile_completed) {
    return { error: "Your profile is already complete." };
  }

  const admin = createAdminClient();

  // 1. Role + basic details (still incomplete).
  const { error: roleError } = await admin
    .from("profiles")
    .update({ full_name: data.full_name, phone: data.phone, role: data.role })
    .eq("id", user.id)
    .eq("profile_completed", false);
  if (roleError) return { error: roleError.message };

  // 2. Role-specific data (idempotent on retry).
  if (data.role === "member") {
    // Display-only reference info for the admin activation view — same place
    // the email signup form keeps it (auth user_metadata).
    const { data: existing } = await admin.auth.admin.getUserById(user.id);
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(existing.user?.user_metadata ?? {}),
        occupation: data.occupation,
        committee_preference: data.committee_preference,
        reason_for_joining: data.reason_for_joining,
      },
    });
    if (error) return { error: error.message };
  } else if (data.role === "sponsor") {
    const { data: existing } = await admin
      .from("sponsors")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!existing) {
      const { error } = await admin
        .from("sponsors")
        .insert({ profile_id: user.id, sponsorship_type: "long_term" });
      if (error) return { error: error.message };
    }
  } else {
    const { data: existing } = await admin
      .from("mentors")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!existing) {
      const { error } = await admin.from("mentors").insert({
        profile_id: user.id,
        mentor_track: data.mentor_track,
        profession: data.profession,
        expertise: data.expertise,
        availability: data.availability,
        preferred_age_group: data.preferred_age_group,
        motivation: data.motivation,
      });
      if (error) return { error: error.message };
    }
  }

  // 3. Mark complete. Status is deliberately untouched (stays 'pending').
  const { error: doneError } = await admin
    .from("profiles")
    .update({ profile_completed: true })
    .eq("id", user.id);
  if (doneError) return { error: doneError.message };

  redirect("/pending");
}
