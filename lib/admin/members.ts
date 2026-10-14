import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export type MemberRow = Database["public"]["Tables"]["profiles"]["Row"];

export async function getMembers(): Promise<MemberRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "member")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getMember(id: string): Promise<MemberRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("role", "member")
    .maybeSingle();
  return data;
}

export type SignupReference = {
  occupation: string | null;
  committee_preference: string | null;
  reason_for_joining: string | null;
};

// Read-only context captured at signup — stored in auth user_metadata, not
// a profiles column (see the comment on signUpMember). Needs the
// service-role client; nothing here is ever written back to auth, only read.
export async function getSignupReference(id: string): Promise<SignupReference> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(id);
  if (error || !data.user) {
    return {
      occupation: null,
      committee_preference: null,
      reason_for_joining: null,
    };
  }
  const meta = data.user.user_metadata ?? {};
  return {
    occupation: typeof meta.occupation === "string" ? meta.occupation : null,
    committee_preference:
      typeof meta.committee_preference === "string"
        ? meta.committee_preference
        : null,
    reason_for_joining:
      typeof meta.reason_for_joining === "string"
        ? meta.reason_for_joining
        : null,
  };
}
