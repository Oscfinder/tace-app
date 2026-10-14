import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

// Every query here runs under the member's own RLS. Nothing touches
// `beneficiaries` or `applications` — children appear only via stories and
// the consent-gated `public_beneficiaries` view.

export const PAGE_SIZE = 10;

export type AnnouncementRow =
  Database["public"]["Tables"]["announcements"]["Row"];
export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type NotificationRow =
  Database["public"]["Tables"]["notifications"]["Row"];
export type CommitteeUpdateRow =
  Database["public"]["Tables"]["committee_updates"]["Row"];

export type MemberProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  member_type: "trustee" | "member" | null;
  trustee_role: string | null;
  committee: string | null;
  avatar_url: string | null;
};

export async function getMemberProfile(): Promise<MemberProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, member_type, trustee_role, committee, avatar_url",
    )
    .eq("id", user.id)
    .single();
  return data;
}

export async function getAvatarUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("avatars")
    .createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export function firstOfMonth(date = new Date()) {
  return `${date.toISOString().slice(0, 7)}-01`;
}

// ── Home ────────────────────────────────────────────────────────────────

export async function getBeneficiaryCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("public_beneficiaries")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

export async function getMemberCounts() {
  const supabase = await createClient();
  const head = { count: "exact", head: true } as const;
  const [events, campaigns, announcements, stories] = await Promise.all([
    supabase
      .from("events")
      .select("id", head)
      .gte("event_date", new Date().toISOString()),
    supabase
      .from("projects")
      .select("id", head)
      .eq("is_published", true)
      .eq("status", "active"),
    supabase.from("announcements").select("id", head).eq("is_published", true),
    supabase.from("stories").select("id", head).eq("is_published", true),
  ]);
  return {
    upcomingEvents: events.count ?? 0,
    activeCampaigns: campaigns.count ?? 0,
    announcements: announcements.count ?? 0,
    stories: stories.count ?? 0,
  };
}

export async function getLatestAnnouncement(): Promise<AnnouncementRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getUpcomingEvents(limit?: number): Promise<EventRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select("*")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true });
  if (limit) query = query.limit(limit);
  const { data } = await query;
  return data ?? [];
}

export async function getCommitteeLead(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("committee_lead")
    .select("full_name")
    .limit(1)
    .maybeSingle();
  return data?.full_name ?? null;
}

export async function getNextCommitteeMeeting(
  committee: string,
): Promise<EventRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("event_type", "meeting")
    .gte("event_date", new Date().toISOString())
    .ilike("title", `%${committee}%`)
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data;
}

// ── Announcements ───────────────────────────────────────────────────────

export async function getAnnouncementsPage(page: number) {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await supabase
    .from("announcements")
    .select("*", { count: "exact" })
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(from, from + PAGE_SIZE - 1);
  return { rows: data ?? [], total: count ?? 0 };
}

// ── Impact feed ─────────────────────────────────────────────────────────

export type ImpactStory = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  photoUrl: string | null;
  publishedAt: string | null;
  childFirstName: string | null;
  stage: Database["public"]["Views"]["public_beneficiaries"]["Row"]["current_stage"] | null;
};

export async function getImpactStoriesPage(page: number) {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await supabase
    .from("stories")
    .select("*", { count: "exact" })
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(from, from + PAGE_SIZE - 1);
  const stories = data ?? [];

  // Stage + first name come only from the consent-gated public view.
  const ids = stories
    .map((s) => s.beneficiary_id)
    .filter((id): id is string => Boolean(id));
  const childById = new Map<string, { first_name: string; stage: ImpactStory["stage"] }>();
  if (ids.length > 0) {
    const { data: children } = await supabase
      .from("public_beneficiaries")
      .select("id, first_name, current_stage")
      .in("id", ids);
    for (const c of children ?? []) {
      childById.set(c.id, { first_name: c.first_name, stage: c.current_stage });
    }
  }

  const rows: ImpactStory[] = stories.map((s) => {
    const child = s.beneficiary_id ? childById.get(s.beneficiary_id) : undefined;
    return {
      id: s.id,
      title: s.title,
      excerpt: s.excerpt,
      content: s.content,
      photoUrl: s.photo_url
        ? supabase.storage.from("public-assets").getPublicUrl(s.photo_url).data
            .publicUrl
        : null,
      publishedAt: s.published_at,
      childFirstName: child?.first_name ?? null,
      stage: child?.stage ?? null,
    };
  });
  return { rows, total: count ?? 0 };
}

// ── Committee ───────────────────────────────────────────────────────────

export async function getMyCommitteeUpdates(
  memberId: string,
): Promise<CommitteeUpdateRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("committee_updates")
    .select("*")
    .eq("member_id", memberId)
    .order("update_month", { ascending: false })
    .limit(12);
  return data ?? [];
}

// ── Events ──────────────────────────────────────────────────────────────

export async function getMyRsvps(
  profileId: string,
): Promise<Map<string, "attending" | "declined">> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_rsvps")
    .select("event_id, status")
    .eq("profile_id", profileId);
  return new Map((data ?? []).map((r) => [r.event_id, r.status]));
}

export async function getPastMeetings(): Promise<EventRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("event_type", "meeting")
    .lt("event_date", new Date().toISOString())
    .order("event_date", { ascending: false })
    .limit(20);
  return data ?? [];
}

// ── Campaigns ───────────────────────────────────────────────────────────

export type Campaign = {
  id: string;
  title: string;
  description: string | null;
  target: number | null;
  raised: number;
  children: {
    id: string;
    first_name: string;
    age: number;
    photoUrl: string | null;
  }[];
};

export async function getCampaigns(): Promise<Campaign[]> {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, description, target_amount")
    .eq("is_published", true)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  const list = projects ?? [];
  if (list.length === 0) return [];
  const projectIds = list.map((p) => p.id);

  const [{ data: funding }, { data: links }] = await Promise.all([
    supabase
      .from("project_funding")
      .select("project_id, raised")
      .in("project_id", projectIds),
    supabase
      .from("project_beneficiaries")
      .select("project_id, beneficiary_id")
      .in("project_id", projectIds),
  ]);

  const childIds = [...new Set((links ?? []).map((l) => l.beneficiary_id))];
  const childById = new Map<string, Campaign["children"][number]>();
  if (childIds.length > 0) {
    const { data: children } = await supabase
      .from("public_beneficiaries")
      .select("id, first_name, age, photo_url")
      .in("id", childIds);
    await Promise.all(
      (children ?? []).map(async (c) => {
        let photoUrl: string | null = null;
        if (c.photo_url) {
          const { data: signed } = await supabase.storage
            .from("beneficiary-photos")
            .createSignedUrl(c.photo_url, 3600);
          photoUrl = signed?.signedUrl ?? null;
        }
        childById.set(c.id, {
          id: c.id,
          first_name: c.first_name,
          age: c.age,
          photoUrl,
        });
      }),
    );
  }

  const raisedById = new Map(
    (funding ?? []).map((f) => [f.project_id, Number(f.raised)]),
  );
  return list.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    target: p.target_amount === null ? null : Number(p.target_amount),
    raised: raisedById.get(p.id) ?? 0,
    // Only children who pass the consent gate (present in public_beneficiaries).
    children: (links ?? [])
      .filter((l) => l.project_id === p.id)
      .map((l) => childById.get(l.beneficiary_id))
      .filter((c): c is Campaign["children"][number] => Boolean(c)),
  }));
}

// ── Resources ───────────────────────────────────────────────────────────

export type ResourceGroup = {
  category: string;
  files: { name: string; url: string }[];
};

export async function getResources(): Promise<ResourceGroup[]> {
  const supabase = await createClient();
  const { data: top } = await supabase.storage
    .from("resources")
    .list("", { limit: 100, sortBy: { column: "name", order: "asc" } });
  // Folders come back with a null id; files at the root are grouped as "General".
  const entries = top ?? [];
  const folders = entries.filter((e) => e.id === null).map((e) => e.name);
  const rootFiles = entries.filter(
    (e) => e.id !== null && e.name !== ".emptyFolderPlaceholder",
  );

  async function sign(paths: { name: string; path: string }[]) {
    const out: { name: string; url: string }[] = [];
    await Promise.all(
      paths.map(async (f) => {
        const { data } = await supabase.storage
          .from("resources")
          .createSignedUrl(f.path, 3600);
        if (data?.signedUrl) out.push({ name: f.name, url: data.signedUrl });
      }),
    );
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }

  const groups: ResourceGroup[] = [];
  for (const folder of folders) {
    const { data: files } = await supabase.storage
      .from("resources")
      .list(folder, { limit: 100, sortBy: { column: "name", order: "asc" } });
    const real = (files ?? []).filter(
      (f) => f.id !== null && f.name !== ".emptyFolderPlaceholder",
    );
    if (real.length === 0) continue;
    groups.push({
      category: folder,
      files: await sign(real.map((f) => ({ name: f.name, path: `${folder}/${f.name}` }))),
    });
  }
  if (rootFiles.length > 0) {
    groups.push({
      category: "General",
      files: await sign(rootFiles.map((f) => ({ name: f.name, path: f.name }))),
    });
  }
  return groups;
}

// ── Notifications ───────────────────────────────────────────────────────

export async function getNotificationSummary(): Promise<{
  latest: NotificationRow[];
  unread: number;
}> {
  const supabase = await createClient();
  const [{ data }, { count }] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false),
  ]);
  return { latest: data ?? [], unread: count ?? 0 };
}
