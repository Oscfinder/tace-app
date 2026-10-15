import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranscript } from "@/lib/admin/messages";
import { FlagButton } from "@/components/admin/messages/flag-button";
import { MatchControls } from "@/components/admin/mentors/match-controls";
import { MatchStatusBadge } from "@/components/admin/mentors/badges";

const card =
  "rounded-[13px] border border-[#e5edf6] bg-white p-5 shadow-[0_8px_28px_rgba(20,55,95,0.07)]";

export default async function AdminTranscriptPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const data = await getTranscript(matchId);
  if (!data) notFound();
  const { summary, messages } = data;

  return (
    <div className="flex flex-col gap-5 pt-5">
      <Link
        href="/dashboard/admin/messages"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-tace-blue hover:underline"
      >
        <ArrowLeft className="size-4" />
        All conversations
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-tace-navy">
            {summary.mentorName} ↔ {summary.childName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <MatchStatusBadge status={summary.status} />
            <span className="text-xs text-tace-gray">
              Read-only. Staff cannot send, edit or delete messages.
            </span>
          </div>
        </div>
        <MatchControls matchId={summary.matchId} status={summary.status} childName={summary.childName} />
      </div>

      <section className={card}>
        <h2 className="font-heading text-base font-semibold text-tace-navy">
          Transcript ({messages.length})
        </h2>
        {messages.length > 0 ? (
          <div className="mt-3 flex flex-col gap-3">
            {messages.map((m) => {
              const mentor = m.sender_type === "mentor";
              return (
                <article
                  key={m.id}
                  className={`rounded-xl border p-3.5 ${
                    m.is_flagged
                      ? "border-[#ffd3df] bg-[#fff6f8]"
                      : mentor
                        ? "border-[#e5edf6] bg-white"
                        : "border-[#e5edf6] bg-[#f6f9fd]"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-tace-gray">
                    <strong className="text-tace-navy">
                      {mentor ? `${summary.mentorName} (mentor)` : "Child's account"}
                    </strong>
                    <time dateTime={m.created_at}>
                      {new Date(m.created_at).toLocaleString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                    {m.read_at ? <span>Read</span> : <span>Unread</span>}
                    {m.is_flagged ? (
                      <span className="rounded-full bg-[#ffecef] px-2 py-0.5 font-bold text-[#f45b69]">
                        Flagged
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-tace-navy">
                    {m.content}
                  </p>
                  {m.flag_reason ? (
                    <p className="mt-1.5 text-xs text-tace-gray">
                      {m.is_flagged ? "Reason: " : ""}
                      {m.flag_reason}
                    </p>
                  ) : null}
                  <div className="mt-2">
                    <FlagButton messageId={m.id} flagged={m.is_flagged ?? false} />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-tace-gray/70">No messages in this conversation yet.</p>
        )}
      </section>
    </div>
  );
}
