import { createClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/lib/messaging/types";

// Runs under the signed-in user's own RLS, so a third party gets nothing even
// if they guess a match id: the match and its messages simply don't come back.
export async function getThread(matchId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: match } = await supabase
    .from("mentorship_matches")
    .select("id, status")
    .eq("id", matchId)
    .maybeSingle();
  if (!match) return null;

  const { data: rows } = await supabase
    .from("mentorship_messages")
    .select("id, sender_id, content, created_at, is_flagged, read_at")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true })
    .limit(500);

  const messages: ChatMessage[] = (rows ?? []).map((r) => ({
    id: r.id,
    sender_id: r.sender_id,
    content: r.content,
    created_at: r.created_at,
    is_flagged: r.is_flagged ?? false,
    read_at: r.read_at,
  }));

  // Opening the thread marks the other side's visible messages as read. (The
  // read happened above, so unread markers are not lost by this.)
  await supabase.rpc("mark_thread_read", { p_match_id: matchId });

  return { userId: user.id, matchId: match.id, status: match.status ?? "pending_consent", messages };
}

// The child's account: its own current (active or paused) mentorship, if any.
export async function getMyConversationMatch() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mentorship_matches")
    .select("id, status")
    .in("status", ["active", "paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}
