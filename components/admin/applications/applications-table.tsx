"use client";

import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { ApplicationStatusBadge } from "@/components/admin/applications/status-badge";
import { calculateAge } from "@/lib/age";
import type { ApplicationRow } from "@/lib/admin/applications";

const APPLICANT_TYPE_LABELS: Record<string, string> = {
  self: "Self",
  guardian: "Guardian",
  organisation: "Organisation",
};

export function ApplicationsTable({
  applications,
}: {
  applications: ApplicationRow[];
}) {
  const router = useRouter();

  const columns: DataTableColumn<ApplicationRow>[] = [
    {
      key: "child_name",
      header: "Child",
      accessor: (row) => `${row.child_first_name} ${row.child_last_name}`,
      sortable: true,
    },
    {
      key: "age",
      header: "Age",
      accessor: (row) => calculateAge(row.child_dob),
      render: (row) => calculateAge(row.child_dob),
    },
    {
      key: "applicant_type",
      header: "Applicant Type",
      accessor: (row) => row.applicant_type,
      render: (row) =>
        row.applicant_type
          ? (APPLICANT_TYPE_LABELS[row.applicant_type] ?? row.applicant_type)
          : "—",
    },
    {
      key: "created_at",
      header: "Date Submitted",
      accessor: (row) => row.created_at,
      render: (row) => new Date(row.created_at).toLocaleDateString("en-GB"),
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => row.status,
      render: (row) => <ApplicationStatusBadge status={row.status} />,
    },
  ];

  return (
    <DataTable
      data={applications}
      columns={columns}
      getRowId={(row) => row.id}
      onRowClick={(row) =>
        router.push(`/dashboard/admin/applications/${row.id}`)
      }
      searchPlaceholder="Search by child name..."
      searchAccessor={(row) =>
        `${row.child_first_name} ${row.child_last_name}`
      }
      filters={[
        {
          key: "status",
          label: "Status",
          accessor: (row) => row.status,
          options: [
            { label: "Pending", value: "pending" },
            { label: "Approved", value: "approved" },
            { label: "Rejected", value: "rejected" },
            { label: "Flagged", value: "flagged" },
          ],
        },
        {
          key: "applicant_type",
          label: "Applicant Type",
          accessor: (row) => row.applicant_type,
          options: [
            { label: "Self", value: "self" },
            { label: "Guardian", value: "guardian" },
            { label: "Organisation", value: "organisation" },
          ],
        },
      ]}
      emptyMessage="No applications yet."
    />
  );
}
