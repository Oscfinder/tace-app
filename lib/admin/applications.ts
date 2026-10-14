import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];

export async function getApplications(): Promise<ApplicationRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getApplication(
  id: string,
): Promise<ApplicationRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export type AssignableMentor = {
  id: string;
  full_name: string;
  profession: string | null;
  mentor_track: string | null;
};

export async function getAssignableMentors(): Promise<AssignableMentor[]> {
  const supabase = await createClient();

  const { data: mentorRows } = await supabase
    .from("mentors")
    .select("id, profile_id, profession, mentor_track");
  const mentors = (mentorRows ?? []).filter(
    (m): m is typeof m & { profile_id: string } => Boolean(m.profile_id),
  );
  if (mentors.length === 0) return [];

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, full_name, status")
    .in(
      "id",
      mentors.map((m) => m.profile_id),
    )
    .eq("status", "active");

  const activeProfiles = new Map(
    (profileRows ?? []).map((p) => [p.id, p.full_name]),
  );

  return mentors
    .filter((m) => activeProfiles.has(m.profile_id))
    .map((m) => ({
      id: m.id,
      full_name: activeProfiles.get(m.profile_id)!,
      profession: m.profession,
      mentor_track: m.mentor_track,
    }));
}
