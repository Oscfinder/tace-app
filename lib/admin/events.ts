import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type AdminEventRow = Database["public"]["Tables"]["events"]["Row"];

export async function getAdminEvents(): Promise<AdminEventRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: false, nullsFirst: false });
  return data ?? [];
}

// Upcoming (soonest first) and past (most recent first), split on the server.
export async function getAdminEventGroups() {
  const all = await getAdminEvents();
  const now = Date.now();
  const isUpcoming = (e: AdminEventRow) =>
    !!e.event_date && new Date(e.event_date).getTime() >= now;
  const upcoming = all
    .filter(isUpcoming)
    .sort(
      (a, b) =>
        new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime(),
    );
  const past = all.filter((e) => !isUpcoming(e));
  return { upcoming, past };
}
