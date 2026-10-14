import { getAvatarUrl, getMemberProfile } from "@/lib/member/queries";
import { ProfileForm } from "@/components/member/profile-form";
import { Card, PageHeader } from "@/components/member/ui";

export default async function MemberProfilePage() {
  const profile = await getMemberProfile();
  if (!profile) return null;
  const avatarUrl = await getAvatarUrl(profile.avatar_url);

  const readOnly: [string, string][] = [
    ["Member type", profile.member_type === "trustee" ? "Trustee" : "Member"],
    ["Trustee role", profile.trustee_role ?? "—"],
    ["Committee", profile.committee ?? "Not assigned yet"],
  ];

  return (
    <div className="flex flex-col gap-6 pt-5">
      <PageHeader title="My Profile" />
      <Card>
        <ProfileForm
          fullName={profile.full_name}
          phone={profile.phone ?? ""}
          email={profile.email}
          avatarUrl={avatarUrl}
        />
      </Card>
      <Card>
        <h2 className="font-heading text-base font-semibold text-tace-navy">
          Your role
        </h2>
        <p className="mt-1 text-sm text-tace-gray">
          These are set by an admin and can&apos;t be changed here.
        </p>
        <dl className="mt-3 grid gap-3 sm:grid-cols-3">
          {readOnly.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-tace-gray">{label}</dt>
              <dd className="text-sm font-medium text-tace-navy">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
