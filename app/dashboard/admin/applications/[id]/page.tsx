import { notFound } from "next/navigation";
import {
  getApplication,
  getAssignableMentors,
} from "@/lib/admin/applications";
import { ApplicationDetailSections } from "@/components/admin/applications/application-detail-sections";
import { ApplicationActions } from "@/components/admin/applications/application-actions";
import { AdminNotesPanel } from "@/components/admin/applications/admin-notes-panel";
import { ApplicationStatusBadge } from "@/components/admin/applications/status-badge";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [application, mentors] = await Promise.all([
    getApplication(id),
    getAssignableMentors(),
  ]);

  if (!application) notFound();

  return (
    <div className="flex flex-col gap-5 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold text-tace-navy">
              {application.child_first_name} {application.child_last_name}
            </h1>
            <ApplicationStatusBadge status={application.status} />
          </div>
          <p className="mt-1 text-sm text-tace-gray">
            Submitted {new Date(application.created_at).toLocaleString("en-GB")}
            {application.reviewed_at
              ? ` · Reviewed ${new Date(application.reviewed_at).toLocaleString("en-GB")}`
              : ""}
          </p>
        </div>
        <ApplicationActions
          applicationId={application.id}
          status={application.status}
          mentors={mentors}
        />
      </div>

      <ApplicationDetailSections application={application} />

      <AdminNotesPanel
        applicationId={application.id}
        initialNotes={application.admin_notes}
      />
    </div>
  );
}
