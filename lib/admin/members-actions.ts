"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { sendEmail } from "@/lib/email/send";
import { trusteeRoleSchema } from "@/lib/validations/auth";
import type { Database } from "@/types/database";

type ActionResult = { error: string } | { success: true };
type MemberType =
  Database["public"]["Tables"]["profiles"]["Row"]["member_type"];

type Assignment = {
  profileId: string;
  memberType: MemberType;
  committee: string | null;
  trusteeRole: string | null;
};

function assignmentFields(input: Assignment) {
  return {
    member_type: input.memberType,
    committee: input.committee,
    trustee_role: input.memberType === "trustee" ? input.trusteeRole : null,
  };
}

/** Column stays plain text (no migration), but a trustee's role must still
 * come from the fixed list — validated here since the dropdown only
 * constrains the client, never trust that alone. */
function validateTrusteeRole(input: Assignment): string | null {
  if (input.memberType !== "trustee") return null;
  const result = trusteeRoleSchema.safeParse(input.trusteeRole);
  return result.success ? null : "Choose a valid trustee role.";
}

export async function activateMember(input: Assignment): Promise<ActionResult> {
  await requireRole("admin");
  if (!input.memberType) return { error: "Choose Member or Trustee." };
  const trusteeRoleError = validateTrusteeRole(input);
  if (trusteeRoleError) return { error: trusteeRoleError };
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", input.profileId)
    .eq("role", "member")
    .maybeSingle();
  if (!profile) return { error: "Member not found." };

  const { error } = await supabase
    .from("profiles")
    .update({ status: "active", ...assignmentFields(input) })
    .eq("id", input.profileId);
  if (error) return { error: error.message };

  try {
    await sendEmail({
      to: profile.email,
      subject: "TACE Foundation — You're approved",
      html: `<p>Hi ${profile.full_name},</p>
<p>Your TACE Foundation membership has been approved. You can now sign in and access your member dashboard.</p>`,
    });
  } catch (err) {
    console.error("Member approval email failed to send:", err);
  }

  revalidatePath("/dashboard/admin/members");
  revalidatePath(`/dashboard/admin/members/${input.profileId}`);
  return { success: true };
}

export async function deactivateMember(
  profileId: string,
): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ status: "inactive" })
    .eq("id", profileId)
    .eq("role", "member");
  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/members");
  revalidatePath(`/dashboard/admin/members/${profileId}`);
  return { success: true };
}

export async function updateMemberAssignment(
  input: Assignment,
): Promise<ActionResult> {
  await requireRole("admin");
  if (!input.memberType) return { error: "Choose Member or Trustee." };
  const trusteeRoleError = validateTrusteeRole(input);
  if (trusteeRoleError) return { error: trusteeRoleError };
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update(assignmentFields(input))
    .eq("id", input.profileId)
    .eq("role", "member");
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/admin/members/${input.profileId}`);
  return { success: true };
}

export async function createAnnouncement(input: {
  title: string;
  content: string;
}): Promise<ActionResult> {
  const session = await requireRole("admin");
  if (!input.title.trim() || !input.content.trim()) {
    return { error: "Title and content are both required." };
  }
  const supabase = await createClient();

  const { error } = await supabase.from("announcements").insert({
    title: input.title,
    content: input.content,
    is_published: true,
    published_at: new Date().toISOString(),
    created_by: session.user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/members");
  return { success: true };
}
