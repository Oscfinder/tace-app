import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";
import {
  getBeneficiary,
  getInterventions,
  getLinkedMentor,
  getLinkedSponsor,
  getMentorshipMatch,
  getRecentMessages,
  getDocuments,
} from "@/lib/admin/beneficiaries";
import { getApplication, getAssignableMentors } from "@/lib/admin/applications";
import { ApplicationDetailSections } from "@/components/admin/applications/application-detail-sections";
import { StageBadge } from "@/components/admin/beneficiaries/stage-badge";
import { StageManager } from "@/components/admin/beneficiaries/stage-manager";
import { MentorAssignment } from "@/components/admin/beneficiaries/mentor-assignment";
import { InterventionLogger } from "@/components/admin/beneficiaries/intervention-logger";
import { DocumentUploader } from "@/components/admin/beneficiaries/document-uploader";
import { calculateAge } from "@/lib/age";
import { getAssessments } from "@/lib/career/queries";
import { CareerAssessmentCard } from "@/components/admin/beneficiaries/career-assessment-card";

const SENDER_LABELS: Record<string, string> = {
  mentor: "Mentor",
  beneficiary: "Beneficiary",
  guardian: "Guardian",
  admin: "Admin",
};

export default async function BeneficiaryProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const beneficiary = await getBeneficiary(id);
  if (!beneficiary) notFound();

  const [
    application,
    interventions,
    linkedMentor,
    linkedSponsor,
    match,
    messages,
    documents,
    assignableMentors,
    assessments,
  ] = await Promise.all([
    beneficiary.application_id
      ? getApplication(beneficiary.application_id)
      : Promise.resolve(null),
    getInterventions(id),
    getLinkedMentor(beneficiary.mentor_id),
    getLinkedSponsor(beneficiary.sponsor_id),
    getMentorshipMatch(id),
    getRecentMessages(id),
    getDocuments(id),
    getAssignableMentors(),
    getAssessments(id),
  ]);

  return (
    <div className="flex flex-col gap-5 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {beneficiary.photoUrl ? (
            <Image
              src={beneficiary.photoUrl}
              alt=""
              width={64}
              height={64}
              className="size-16 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-16 items-center justify-center rounded-full bg-tace-lgray text-tace-gray">
              <User className="size-7" />
            </span>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-bold text-tace-navy">
                {beneficiary.first_name} {beneficiary.last_name}
              </h1>
              <StageBadge stage={beneficiary.current_stage} />
            </div>
            <p className="mt-1 text-sm text-tace-gray">
              {beneficiary.tace_id ?? "No TACE ID"} ·{" "}
              {calculateAge(beneficiary.date_of_birth)} yrs
              {beneficiary.state_of_origin
                ? ` · ${beneficiary.state_of_origin}`
                : ""}
            </p>
          </div>
        </div>
        <StageManager
          beneficiaryId={beneficiary.id}
          currentStage={beneficiary.current_stage}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1.1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          {application ? (
            <ApplicationDetailSections application={application} />
          ) : (
            <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-6 text-sm text-tace-gray">
              No linked application on file for this beneficiary.
            </div>
          )}

          <CareerAssessmentCard latest={assessments[0]} />

          <InterventionLogger
            beneficiaryId={beneficiary.id}
            interventions={interventions}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          {linkedSponsor ? (
            <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-5">
              <h3 className="font-heading text-sm font-semibold text-tace-navy">
                Sponsor
              </h3>
              <Link
                href={`/dashboard/admin/sponsors/${linkedSponsor.id}`}
                className="mt-2 block text-sm font-medium text-tace-blue hover:underline"
              >
                {linkedSponsor.full_name}
              </Link>
            </div>
          ) : (
            <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-5">
              <h3 className="font-heading text-sm font-semibold text-tace-navy">
                Sponsor
              </h3>
              <p className="mt-2 text-sm text-tace-gray/70">Unsponsored</p>
            </div>
          )}

          {linkedMentor && !match ? (
            <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-5">
              <h3 className="font-heading text-sm font-semibold text-tace-navy">
                Mentor
              </h3>
              <Link
                href={`/dashboard/admin/mentors/${linkedMentor.id}`}
                className="mt-2 block text-sm font-medium text-tace-blue hover:underline"
              >
                {linkedMentor.full_name}
              </Link>
              {linkedMentor.profession ? (
                <p className="text-sm text-tace-gray">
                  {linkedMentor.profession}
                </p>
              ) : null}
            </div>
          ) : (
            <MentorAssignment
              beneficiaryId={beneficiary.id}
              match={match}
              mentors={assignableMentors}
            />
          )}

          {match ? (
            <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-5">
              <h3 className="font-heading text-sm font-semibold text-tace-navy">
                Recent Messages
              </h3>
              {messages.length > 0 ? (
                <div className="mt-3 flex flex-col gap-2.5">
                  {messages.map((m) => (
                    <div key={m.id} className="text-sm">
                      <span className="font-semibold text-tace-navy">
                        {SENDER_LABELS[m.sender_type ?? ""] ?? "Unknown"}:
                      </span>{" "}
                      <span className="text-tace-gray">{m.content}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-tace-gray/70">
                  No messages yet.
                </p>
              )}
            </div>
          ) : null}

          <DocumentUploader
            beneficiaryId={beneficiary.id}
            documents={documents}
          />
        </div>
      </div>
    </div>
  );
}
