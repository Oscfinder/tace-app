import { getMentorProfile } from "@/lib/mentor/queries";
import { MentorProfileForm } from "@/components/mentor/mentor-profile-form";
import { VETTING_LABELS, TRACK_LABELS } from "@/lib/mentoring/constants";
import { Card, DetailRow, PageHeader, Panel, Pill } from "@/components/member/ui";

export default async function MentorProfilePage() {
  const data = await getMentorProfile();
  if (!data) return null;
  const { profile, mentor } = data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="My profile"
        title="Your details"
        subtitle="Keep your contact details and availability up to date."
      />

      <Card>
        <MentorProfileForm
          fullName={profile.full_name}
          phone={profile.phone ?? ""}
          email={profile.email}
          availability={mentor.availability}
          expertise={mentor.expertise ?? ""}
        />
      </Card>

      <Panel
        title="Vetting and track"
        subtitle="Set by the TACE team. You can't change these here."
      >
        <DetailRow
          label="Vetting status"
          value={
            <Pill accent={mentor.vetting_status === "cleared" ? "teal" : "amber"}>
              {VETTING_LABELS[mentor.vetting_status]}
            </Pill>
          }
        />
        <DetailRow
          label="Cleared on"
          value={
            mentor.vetted_at
              ? new Date(mentor.vetted_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "—"
          }
        />
        <DetailRow
          label="Mentor track"
          value={mentor.mentor_track ? TRACK_LABELS[mentor.mentor_track] : "—"}
        />
        <DetailRow label="Profession" value={mentor.profession ?? "—"} />
        <DetailRow label="Preferred age group" value={mentor.preferred_age_group ?? "—"} />
        <DetailRow
          label="Code of conduct"
          value={
            mentor.code_of_conduct_accepted_at
              ? `Accepted ${new Date(mentor.code_of_conduct_accepted_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`
              : "Not accepted"
          }
        />
      </Panel>
    </div>
  );
}
