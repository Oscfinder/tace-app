import { notFound } from "next/navigation";
import { getMember, getSignupReference } from "@/lib/admin/members";
import {
  MemberStatusBadge,
  MemberTypeBadge,
} from "@/components/admin/members/member-badges";
import { MemberAssignmentPanel } from "@/components/admin/members/member-assignment-panel";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getMember(id);
  if (!member) notFound();

  const signup = await getSignupReference(id);

  return (
    <div className="flex flex-col gap-5 pt-5">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-bold text-tace-navy">
            {member.full_name}
          </h1>
          <MemberTypeBadge type={member.member_type} />
          <MemberStatusBadge status={member.status} />
        </div>
        <p className="mt-1 text-sm text-tace-gray">
          {member.email}
          {member.phone ? ` · ${member.phone}` : ""}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,1fr)]">
        <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-6">
          <h2 className="font-heading text-base font-semibold text-tace-navy">
            Sign-up Details
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-tace-gray/70">
                Occupation
              </div>
              <div className="mt-0.5 text-sm text-tace-navy">
                {signup.occupation ?? (
                  <span className="text-tace-gray/50">—</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-tace-gray/70">
                Committee Preference
              </div>
              <div className="mt-0.5 text-sm text-tace-navy">
                {signup.committee_preference ?? (
                  <span className="text-tace-gray/50">—</span>
                )}
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-tace-gray/70">
                Why They Want to Join
              </div>
              <div className="mt-0.5 text-sm text-tace-navy">
                {signup.reason_for_joining ?? (
                  <span className="text-tace-gray/50">—</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <MemberAssignmentPanel member={member} />
      </div>
    </div>
  );
}
