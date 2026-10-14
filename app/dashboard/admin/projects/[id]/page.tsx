import { notFound } from "next/navigation";
import {
  getProject,
  getProjectDonationTotal,
  getProjectDonations,
  getAttachedBeneficiaries,
  getUnattachedBeneficiaries,
  getConsentWarnings,
} from "@/lib/admin/projects";
import { ProjectStatusBadge } from "@/components/admin/projects/project-status-badge";
import { PublishToggle } from "@/components/admin/projects/publish-toggle";
import { ArchiveButton } from "@/components/admin/projects/archive-button";
import { BeneficiaryAttachment } from "@/components/admin/projects/beneficiary-attachment";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [currentAmount, donations, attached, unattached, consentWarnings] =
    await Promise.all([
      getProjectDonationTotal(id),
      getProjectDonations(id),
      getAttachedBeneficiaries(id),
      getUnattachedBeneficiaries(id),
      getConsentWarnings(id),
    ]);

  return (
    <div className="flex flex-col gap-5 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold text-tace-navy">
              {project.title}
            </h1>
            <ProjectStatusBadge status={project.status} />
            <span className="text-xs font-bold text-tace-gray/70">
              {project.is_published ? "Published" : "Unpublished"}
            </span>
          </div>
          {project.description ? (
            <p className="mt-1 max-w-xl text-sm text-tace-gray">
              {project.description}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-tace-gray/70">
            {project.start_date
              ? new Date(project.start_date).toLocaleDateString("en-GB")
              : "No start date"}
            {project.end_date
              ? ` – ${new Date(project.end_date).toLocaleDateString("en-GB")}`
              : ""}
          </p>
        </div>
        <div className="flex items-start gap-2.5">
          <PublishToggle
            projectId={project.id}
            isPublished={project.is_published}
            status={project.status}
            consentWarnings={consentWarnings}
          />
          {project.status !== "archived" ? (
            <ArchiveButton projectId={project.id} />
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-tace-gray/70">
            Target
          </div>
          <div className="mt-1 font-heading text-2xl font-bold text-tace-navy">
            {project.target_amount
              ? `₦${Number(project.target_amount).toLocaleString()}`
              : "No target set"}
          </div>
        </div>
        <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-tace-gray/70">
            Raised
          </div>
          <div className="mt-1 font-heading text-2xl font-bold text-tace-green">
            ₦{currentAmount.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,1fr)]">
        <BeneficiaryAttachment
          projectId={project.id}
          attached={attached}
          unattached={unattached}
        />

        <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-6">
          <h2 className="font-heading text-base font-semibold text-tace-navy">
            Donations
          </h2>
          {donations.length > 0 ? (
            <div className="mt-4 flex flex-col">
              {donations.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-3 border-b border-[#F1F3F6] py-2.5 last:border-b-0"
                >
                  <div>
                    <div className="text-sm font-medium text-tace-navy">
                      {d.donor_name}
                    </div>
                    <div className="text-xs text-tace-gray/70">
                      {new Date(d.created_at).toLocaleDateString("en-GB")}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-tace-navy">
                    ₦{Number(d.amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-tace-gray/70">
              No donations logged against this project yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
