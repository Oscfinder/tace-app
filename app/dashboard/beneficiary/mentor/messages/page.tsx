import { redirect } from "next/navigation";
import { getMyMentor } from "@/lib/beneficiary/queries";
import { getMyConversationMatch, getThread } from "@/lib/messaging/queries";
import { ChatThread } from "@/components/messaging/chat-thread";

export default async function ChildChatPage() {
  const match = await getMyConversationMatch();
  // No current mentorship: nothing to chat in yet.
  if (!match) redirect("/dashboard/beneficiary/mentor");

  const [thread, mentor] = await Promise.all([getThread(match.id), getMyMentor()]);
  if (!thread) redirect("/dashboard/beneficiary/mentor");

  return (
    <ChatThread
      matchId={thread.matchId}
      userId={thread.userId}
      initialMessages={thread.messages}
      status={thread.status}
      otherName={mentor?.full_name ?? "your mentor"}
      backHref="/dashboard/beneficiary/mentor"
      backLabel="Back to My Mentor"
    />
  );
}
