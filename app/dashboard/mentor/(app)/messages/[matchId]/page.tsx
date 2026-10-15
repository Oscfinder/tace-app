import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getThread } from "@/lib/messaging/queries";
import { ChatThread } from "@/components/messaging/chat-thread";

export default async function MentorChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  // Row-level security only returns a match this mentor belongs to; anything
  // else (someone else's thread, a made-up id) is a 404.
  const thread = await getThread(matchId);
  if (!thread) notFound();

  const supabase = await createClient();
  const { data: mentee } = await supabase
    .from("mentee_profiles")
    .select("id, first_name")
    .eq("match_id", matchId)
    .maybeSingle();

  return (
    <ChatThread
      matchId={thread.matchId}
      userId={thread.userId}
      initialMessages={thread.messages}
      status={thread.status}
      otherName={mentee?.first_name ?? "your mentee"}
      backHref={mentee ? `/dashboard/mentor/mentees/${mentee.id}` : "/dashboard/mentor/mentees"}
      backLabel={mentee ? `Back to ${mentee.first_name}` : "All mentees"}
    />
  );
}
