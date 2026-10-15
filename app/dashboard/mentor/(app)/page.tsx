import { Inbox } from "lucide-react";
import { getMentorContext, getMentorRequests } from "@/lib/mentor/queries";
import { RequestCard } from "@/components/mentor/request-card";
import { EmptyState, PageHeader } from "@/components/member/ui";

export default async function MentorHomePage() {
  const [ctx, requests] = await Promise.all([getMentorContext(), getMentorRequests()]);
  const firstName = ctx?.fullName.split(" ")[0] ?? "there";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Mentor dashboard"
        title={`Welcome, ${firstName}`}
        subtitle="Thank you for giving your time to a child. Your mentoring requests appear here."
      />

      {ctx && ctx.vettingStatus !== "cleared" ? (
        <p className="rounded-2xl bg-[#fff4dc] px-5 py-4 text-sm font-medium text-[#8a5d00]">
          Your vetting is not marked as cleared, so you can&apos;t be matched yet. Please contact
          the TACE team.
        </p>
      ) : null}

      <section className="flex flex-col gap-4" aria-label="Mentoring requests">
        <h2 className="m-head text-lg font-extrabold text-m-ink">
          Mentoring requests {requests.length > 0 ? `(${requests.length})` : ""}
        </h2>
        {requests.length > 0 ? (
          requests.map((r) => (
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
          ))
        ) : (
          <EmptyState
            icon={Inbox}
            accent="purple"
            title="No requests right now"
            message="When the TACE team matches you with a child, the request will appear here for you to accept or decline. You'll get a notification too."
          />
        )}
      </section>
    </div>
  );
}
