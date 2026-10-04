"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDashboardPath } from "@/lib/auth/guards";
import type { Role } from "@/types/roles";
import type {
  MemberSignupInput,
  MentorSignupInput,
  SponsorSignupInput,
} from "@/lib/validations/auth";

type ActionResult = { error: string } | { success: true };

async function signUp(input: {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
}) {
  const supabase = await createClient();
  return supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.full_name,
        phone: input.phone,
        role: input.role,
      },
    },
  });
}

export async function signUpMember(
  input: MemberSignupInput,
): Promise<ActionResult> {
  const { error } = await signUp({ ...input, role: "member" });
  if (error) return { error: error.message };
  return { success: true };
}

export async function signUpSponsor(
  input: SponsorSignupInput,
): Promise<ActionResult> {
  const { error } = await signUp({ ...input, role: "sponsor" });
  if (error) return { error: error.message };
  return { success: true };
}

export async function signUpMentor(
  input: MentorSignupInput,
): Promise<ActionResult> {
  const { data, error } = await signUp({ ...input, role: "mentor" });
  if (error) return { error: error.message };
  if (!data.user)
    return { error: "Could not create your account. Please try again." };

  // The `mentors` table has no public/self insert policy (by design — see
  // Ticket 1B RLS rules), so this extra-fields insert runs through the
  // service-role admin client rather than the just-created, not-yet-
  // confirmed user's own (anon) session.
  const admin = createAdminClient();

  // Idempotent on retry: if a prior attempt created the auth user/profile
  // but failed before (or during) this insert, the user is stuck — they
  // can't sign up again (email taken) and would otherwise hit a unique-
  // constraint error here forever. Check for an existing mentors row for
  // this profile first; if one's already there, treat it as success
  // instead of erroring or inserting a duplicate.
  const { data: existingMentor, error: existingMentorError } = await admin
    .from("mentors")
    .select("id")
    .eq("profile_id", data.user.id)
    .maybeSingle();

  if (existingMentorError) return { error: existingMentorError.message };
  if (existingMentor) return { success: true };

  const { error: mentorError } = await admin.from("mentors").insert({
    profile_id: data.user.id,
    mentor_track: input.mentor_track,
    profession: input.profession,
    expertise: input.expertise,
    availability: input.availability,
    preferred_age_group: input.preferred_age_group,
    motivation: input.motivation,
  });

  if (mentorError) return { error: mentorError.message };
  return { success: true };
}

export async function signIn(input: {
  email: string;
  password: string;
}): Promise<{ error: string } | never> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(input);

  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    return { error: "Could not load your profile. Please try again." };
  }

  if (profile.status === "inactive" || profile.status === "suspended") {
    await supabase.auth.signOut();
    return {
      error: `Your account is ${profile.status}. Contact TACE support.`,
    };
  }

  if (profile.status === "pending") {
    redirect("/pending");
  }

  redirect(getDashboardPath(profile.role as Role));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
