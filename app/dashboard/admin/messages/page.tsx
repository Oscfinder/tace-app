import Link from "next/link";
import { getFlaggedMessages, getThreads } from "@/lib/admin/messages";
import { FlagButton } from "@/components/admin/messages/flag-button";
import { MatchStatusBadge } from "@/components/admin/mentors/badges";

const card =
  "rounded-[13px] border border-[#e5edf6] bg-white p-5 shadow-[0_8px_28px_rgba(20,55,95,0.07)]";

const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-NG", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

export default async function AdminMessagesPage() {
  const [threads, flagged] = await Promise.all([getThreads(), getFlaggedMessages()]);

  return (
    <div className="flex flex-col gap-6 pt-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-tace-navy">Message Monitor</h1>
        <p className="mt-1 text-sm text-tace-gray">
          Every mentor and child conversation, read-only. Flagged messages are hidden from the
          other person until you release them. Staff cannot send, edit or delete messages.
        </p>
      </div>

      <section className={card}>
        <h2 className="font-heading text-base font-semibold text-tace-navy">
          Flagged messages ({flagged.length})
        </h2>
        {flagged.length > 0 ? (
          <div className="mt-2">
            {flagged.map((m) => (
              <article key={m.id} className="border-b border-[#F1F3F6] py-4 last:border-b-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-tace-gray">
                  <span className="rounded-full bg-[#ffecef] px-2.5 py-1 font-bold text-[#f45b69]">
                    {m.flag_reason ?? "Flagged"}
                  </span>
                  <span>
                    {m.sender_type === "mentor" ? "Mentor" : "Child's account"} ·{" "}
                    {m.mentorName} ↔ {m.childName}
                  </span>
                  <span>{when(m.created_at)}</span>
                </div>
                <p className="mt-2 rounded-lg bg-tace-lgray p-3 text-sm leading-relaxed whitespace-pre-wrap text-tace-navy">
                  {m.content}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <FlagButton messageId={m.id} flagged />
                  <Link
                    href={`/dashboard/admin/messages/${m.match_id}`}
                    className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm font-medium text-tace-blue hover:bg-tace-lgray"
                  >
                    Open conversation
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-tace-gray/70">
            Nothing is flagged. Messages containing phone numbers, emails, links or social names
            are held automatically and will appear here.
          </p>
        )}
      </section>

      <section className={card}>
        <h2 className="font-heading text-base font-semibold text-tace-navy">
          All conversations ({threads.length})
        </h2>
        {threads.length > 0 ? (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#F1F3F6] text-xs tracking-wide text-tace-gray uppercase">
                  <th className="py-2 pr-3 font-semibold">Mentor</th>
                  <th className="py-2 pr-3 font-semibold">Child</th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                  <th className="py-2 pr-3 font-semibold">Messages</th>
                  <th className="py-2 pr-3 font-semibold">Flagged</th>
                  <th className="py-2 pr-3 font-semibold">Last message</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {threads.map((t) => (
                  <tr key={t.matchId} className="border-b border-[#F1F3F6] last:border-b-0">
                    <td className="py-3 pr-3 font-medium text-tace-navy">{t.mentorName}</td>
                    <td className="py-3 pr-3 text-tace-navy">{t.childName}</td>
                    <td className="py-3 pr-3">
                      <MatchStatusBadge status={t.status} />
                    </td>
                    <td className="py-3 pr-3 text-tace-gray">{t.total}</td>
                    <td className="py-3 pr-3">
                      {t.flagged > 0 ? (
                        <span className="rounded-full bg-[#ffecef] px-2 py-0.5 text-xs font-bold text-[#f45b69]">
                          {t.flagged}
                        </span>
                      ) : (
                        <span className="text-tace-gray/60">0</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-tace-gray">{when(t.lastAt)}</td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/dashboard/admin/messages/${t.matchId}`}
                        className="text-sm font-semibold text-tace-blue hover:underline"
                      >
                        Read
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-tace-gray/70">
            No conversations yet. They appear here once a mentorship is active.
          </p>
        )}
      </section>
    </div>
  );
}
