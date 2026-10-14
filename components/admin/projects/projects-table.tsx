"use client";

import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { ProjectStatusBadge } from "@/components/admin/projects/project-status-badge";
import type { ProjectRow } from "@/lib/admin/projects";

export function ProjectsTable({ projects }: { projects: ProjectRow[] }) {
  const router = useRouter();

  const columns: DataTableColumn<ProjectRow>[] = [
    {
      key: "title",
      header: "Title",
      accessor: (row) => row.title,
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => row.status,
      render: (row) => <ProjectStatusBadge status={row.status} />,
    },
    {
      key: "is_published",
      header: "Published",
      accessor: (row) => (row.is_published ? "Published" : "Unpublished"),
    },
    {
      key: "target_amount",
      header: "Target",
      accessor: (row) => Number(row.target_amount ?? 0),
      render: (row) =>
        row.target_amount
          ? `₦${Number(row.target_amount).toLocaleString()}`
          : "—",
    },
    {
      key: "dates",
      header: "Dates",
      accessor: (row) => row.start_date ?? "",
      render: (row) =>
        row.start_date
          ? `${new Date(row.start_date).toLocaleDateString("en-GB")}${
              row.end_date
                ? ` – ${new Date(row.end_date).toLocaleDateString("en-GB")}`
                : ""
            }`
          : "—",
    },
  ];

  return (
    <DataTable
      data={projects}
      columns={columns}
      getRowId={(row) => row.id}
      onRowClick={(row) => router.push(`/dashboard/admin/projects/${row.id}`)}
      searchPlaceholder="Search by title..."
      searchAccessor={(row) => row.title}
      filters={[
        {
          key: "status",
          label: "Status",
          accessor: (row) => row.status,
          options: [
            { label: "Draft", value: "draft" },
            { label: "Active", value: "active" },
            { label: "Completed", value: "completed" },
            { label: "Archived", value: "archived" },
          ],
        },
        {
          key: "is_published",
          label: "Published",
          accessor: (row) => (row.is_published ? "Published" : "Unpublished"),
          options: [
            { label: "Published", value: "Published" },
            { label: "Unpublished", value: "Unpublished" },
          ],
        },
      ]}
      emptyMessage="No projects yet."
    />
  );
}
