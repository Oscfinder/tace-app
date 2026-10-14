import { getAvatarUrl, getMemberProfile } from "@/lib/member/queries";
import { ProfileForm } from "@/components/member/profile-form";
import {
  Card,
  DarkBanner,
  DetailRow,
  PageHeader,
  Panel,
} from "@/components/member/ui";

export default async function MemberProfilePage() {
  const profile = await getMemberProfile();
  if (!profile) return null;
  const avatarUrl = await getAvatarUrl(profile.avatar_url);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="My profile"
        title="Your details"
        subtitle="Keep your contact details up to date."
      />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(290px,0.9fr)]">
        <Card>
          <ProfileForm
            fullName={profile.full_name}
            phone={profile.phone ?? ""}
            email={profile.email}
            avatarUrl={avatarUrl}
          />
        </Card>
        <Panel
          title="Your role"
          subtitle="Set by an admin — can't be changed here"
        >
          <DarkBanner
            label={
              profile.member_type === "trustee"
                ? "Trustee"
                : "Foundation member"
            }
            title={profile.trustee_role ?? profile.committee ?? "TACE Foundation"}
            text="Thank you for being part of the team."
          />
          <DetailRow
            label="Member type"
            value={profile.member_type === "trustee" ? "Trustee" : "Member"}
          />
          <DetailRow label="Trustee role" value={profile.trustee_role ?? "—"} />
          <DetailRow
            label="Committee"
            value={profile.committee ?? "Not assigned yet"}
          />
        </Panel>
      </div>
    </div>
  );
}
