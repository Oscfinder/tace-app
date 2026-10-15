import Link from "next/link";
import { CalendarClock, Inbox, MessageSquare, Users } from "lucide-react";
import {
  getMentees,
  getMentorContext,
  getMentorRequests,
  getUnreadMessageCount,
  upcomingCheckIns,
} from "@/lib/mentor/queries";
import { MenteeCard } from "@/components/mentor/mentee-card";
import { RequestCard } from "@/components/mentor/request-card";
import { EmptyState, Panel, Stat } from "@/components/member/ui";

export default async function MentorHomePage() {
  const [ctx, requests, mentees] = await Promise.all([
    getMentorContext(),
    getMentorRequests(),
    getMentees(),
  ]);
  const unread = ctx ? await getUnreadMessageCount(ctx.userId) : 0;
  const firstName = ctx?.fullName.split(" ")[0] ?? "there";

  const checkIns = upcomingCheckIns(mentees);
  const next = checkIns[0];

  return (
    <div className="flex flex-col gap-6">
      <section>
        <p className="mb-2 text-[11px] font-bold tracking-[1.3px] text-[#0798d9] uppercase">
          Mentor dashboard
        </p>
        <h1 className="text-[27px] font-extrabold tracking-[-1px] text-m-ink">
          Welcome, {firstName} <span className="text-2xl">🌟</span>
        </h1>
        <p className="mt-1.5 text-sm text-m-muted">
          Thank you for giving your time to a child. Here&apos;s what&apos;s happening.
        </p>
      </section>

      {ctx && ctx.vettingStatus !== "cleared" ? (
        <p className="rounded-2xl bg-[#fff4dc] px-5 py-4 text-sm font-medium text-[#8a5d00]">
          Your vetting is not marked as cleared, so you can&apos;t be matched yet. Please contact
          the TACE team.
        </p>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4" aria-label="Summary">
        <Stat
          label="Active mentees"
          value={mentees.length}
          foot={mentees.length > 0 ? "See your mentees" : "None yet"}
          icon={Users}
          accent="purple"
          href="/dashboard/mentor/mentees"
        />
        <Stat
          label="Pending requests"
          value={requests.length}
          foot={requests.length > 0 ? "Waiting for you" : "All answered"}
          icon={Inbox}
          accent="amber"
        />
        <Stat
          label="Next check-in"
          value={
            next?.nextCheckIn
              ? new Date(next.nextCheckIn).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })
              : "None"
          }
          foot={next ? next.first_name : "Nothing scheduled"}
          icon={CalendarClock}
          accent="blue"
        />
        <Stat
          label="Unread messages"
          value={unread}
          foot="From your mentees"
          icon={MessageSquare}
          accent="teal"
        />
      </section>

      {requests.length > 0 ? (
        <section className="flex flex-col gap-4" aria-label="Mentoring requests">
          <h2 className="m-head text-lg font-extrabold text-m-ink">
            Mentoring requests ({requests.length})
          </h2>
          {requests.map((r) => (
            <RequestCard
              key={r.match_id}
              request={{
                matchId: r.match_id,
                firstName: r.first_name,
                age: r.age,
                classLevel: r.class_level,
                interests: r.interests,
                aspirations: r.aspirations,
                consentMentor: r.consent_mentor,
                consentGuardian: r.consent_guardian,
              }}
            />
          ))}
        </section>
      ) : null}

      <Panel
        title="Upcoming check-ins"
        subtitle="Your next scheduled conversations"
        href="/dashboard/mentor/mentees"
        linkLabel="All mentees"
      >
        {checkIns.length > 0 ? (
          <ul>
            {checkIns.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 border-t border-[#eff3f7] py-3 first:border-t-0"
              >
                <CalendarClock className="size-5 shrink-0 text-[#7759e8]" aria-hidden />
                <Link
                  href={`/dashboard/mentor/mentees/${m.id}`}
                  className="min-w-0 flex-1 text-[15px] font-semibold text-m-ink hover:text-[#008fda]"
                >
                  {m.first_name}
                </Link>
                <span className="text-sm text-m-muted">
                  {new Date(m.nextCheckIn!).toLocaleString("en-NG", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-m-muted">
            No check-ins scheduled. Open a mentee to set the next one.
          </p>
        )}
      </Panel>

      <section className="flex flex-col gap-4" aria-label="Your mentees">
        <h2 className="m-head text-lg font-extrabold text-m-ink">Your mentees</h2>
        {mentees.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {mentees.map((m) => (
              <MenteeCard key={m.id} mentee={m} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            accent="purple"
            title="No active mentees yet"
            message="Once you and a child's guardian have both accepted a request, the child will appear here."
          />
        )}
      </section>
    </div>
  );
}
