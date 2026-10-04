import { createClient } from "@/lib/supabase/server";

export type ActivityEventType =
  "application" | "registration" | "donation" | "message";

export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  label: string;
  timestamp: string;
};

export async function getRecentActivity(limit = 10): Promise<ActivityEvent[]> {
  const supabase = await createClient();

  const [applications, registrations, donations, messages] = await Promise.all([
    supabase
      .from("applications")
      .select("id, child_first_name, child_last_name, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("donations")
      .select("id, donor_name, amount, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("mentorship_messages")
      .select("id, sender_type, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const events: ActivityEvent[] = [
    ...(applications.data ?? []).map((a) => ({
      id: `application-${a.id}`,
      type: "application" as const,
      label: `New application: ${a.child_first_name} ${a.child_last_name}`,
      timestamp: a.created_at,
    })),
    ...(registrations.data ?? []).map((r) => ({
      id: `registration-${r.id}`,
      type: "registration" as const,
      label: `New ${r.role} registration: ${r.full_name}`,
      timestamp: r.created_at,
    })),
    ...(donations.data ?? []).map((d) => ({
      id: `donation-${d.id}`,
      type: "donation" as const,
      label: `Donation: ₦${Number(d.amount).toLocaleString()} from ${d.donor_name}`,
      timestamp: d.created_at,
    })),
    ...(messages.data ?? []).map((m) => ({
      id: `message-${m.id}`,
      type: "message" as const,
      label: `New mentorship message from ${m.sender_type ?? "a participant"}`,
      timestamp: m.created_at,
    })),
  ];

  return events
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, limit);
}
