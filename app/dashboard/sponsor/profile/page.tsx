import { getSponsorProfile } from "@/lib/sponsor/queries";
import { SponsorProfileForm } from "@/components/sponsor/sponsor-profile-form";
import { Card, PageHeader } from "@/components/member/ui";

export default async function SponsorProfilePage() {
  const profile = await getSponsorProfile();
  if (!profile) return null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="My profile"
        title="Your details"
        subtitle="Keep your contact details up to date."
      />
      <Card>
        <SponsorProfileForm
          fullName={profile.full_name}
          phone={profile.phone ?? ""}
          email={profile.email}
        />
      </Card>
    </div>
  );
}
