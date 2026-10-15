import Link from "next/link";
import { CalendarClock, GraduationCap, MessageCircle } from "lucide-react";
import {
  getMyBeneficiary,
  getMyMentor,
  getMyMentorRequest,
  getMyActiveMatch,
} from "@/lib/beneficiary/queries";
import { MentorRequestCard } from "@/components/beneficiary/mentor-request-card";
import {
  Card,
  DetailRow,
  EmptyState,
  PageHeader,
  Pill,
} from "@/components/member/ui";

const TRACKS = { career: "Career guidance", tech: "Technology skills" } as const;

export default async function MentorPage() {
  const [mentor, mentorRequest, me, activeMatch] = await Promise.all([
    getMyMentor(),
    getMyMentorRequest(),
    getMyBeneficiary(),
    getMyActiveMatch(),
  ]);
  const nextCheckIn = activeMatch?.next_check_in ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="My mentor"
        title="Your mentor"
        subtitle="Someone who believes in you and is here to guide you."
      />

      {mentorRequest && me ? (
        <MentorRequestCard
          childName={me.first_name}
          request={{
            matchId: mentorRequest.match_id,
            mentorName: mentorRequest.full_name,
            profession: mentorRequest.profession,
            track: mentorRequest.mentor_track,
            mentorAccepted: mentorRequest.consent_mentor,
            guardianAccepted: mentorRequest.consent_guardian,
          }}
        />
      ) : null}

      {mentor ? (
        <>
          <Card>
            <div className="flex items-center gap-4">
              <span
                className="m-head flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#9277f6] to-[#7759e8] text-2xl font-extrabold text-white"
                aria-hidden
              >
                {mentor.full_name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h2 className="m-head text-xl font-extrabold break-words text-m-ink">
                  {mentor.full_name}
                </h2>
                {mentor.profession ? (
                  <p className="text-[15px] text-m-muted">{mentor.profession}</p>
                ) : null}
                {mentor.mentor_track ? (
                  <div className="mt-1.5">
                    <Pill accent="purple">{TRACKS[mentor.mentor_track]}</Pill>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-5">
              <DetailRow
                label="Next check-in"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="size-4 text-[#9277f6]" />
                    {nextCheckIn
                      ? new Date(nextCheckIn).toLocaleString("en-NG", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "Not scheduled yet"}
                  </span>
                }
              />
            </div>

            {activeMatch ? (
              <Link
                href="/dashboard/beneficiary/mentor/messages"
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-m-blue to-m-blue2 text-base font-bold text-white shadow-[0_8px_18px_#009de832]"
              >
                <MessageCircle className="size-5" />
                Send a message
              </Link>
            ) : (
              <p className="mt-4 rounded-xl bg-[#f4f8fd] px-4 py-3 text-center text-sm text-m-muted">
                Messaging is switched off for now.
              </p>
            )}
          </Card>
        </>
      ) : mentorRequest ? null : (
        <EmptyState
          icon={GraduationCap}
          accent="purple"
          title="Your mentor is on the way"
          message="We're carefully matching you with someone who fits you well. We'll let you know as soon as they're ready to meet you."
        />
      )}
    </div>
  );
}
