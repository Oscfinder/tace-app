import { createClient } from "@/lib/supabase/server";

export type UpcomingEvent = {
  id: string;
  title: string;
  location: string | null;
  event_date: string;
};

export async function getUpcomingEvents(limit = 3): Promise<UpcomingEvent[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select("id, title, location, event_date")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(limit);

  return (data ?? []).filter(
    (row): row is UpcomingEvent => row.event_date !== null,
  );
}
