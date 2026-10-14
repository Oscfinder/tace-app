"use client";

import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { MemberStatusBadge } from "@/components/admin/members/member-badges";
import { STATUSES } from "@/types/roles";
import type { SponsorListRow } from "@/lib/admin/sponsors";

const TYPE_LABELS: Record<string, string> = {
  one_time: "One-time",
  long_term: "Long-term",
};

export function SponsorsTable({ sponsors }: { sponsors: SponsorListRow[] }) {
  const router = useRouter();

  const columns: DataTableColumn<SponsorListRow>[] = [
    {
      key: "full_name",
      header: "Name",
      accessor: (row) => row.full_name,
      sortable: true,
    },
    { key: "email", header: "Email", accessor: (row) => row.email },
    { key: "phone", header: "Phone", accessor: (row) => row.phone ?? "—" },
    {
      key: "linked",
      header: "Linked Beneficiary",
      accessor: (row) => row.linkedBeneficiaryName ?? "—",
    },
    {
      key: "total_donated",
      header: "Total Donated",
      accessor: (row) => Number(row.total_donated),
      render: (row) => `₦${Number(row.total_donated).toLocaleString()}`,
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => row.status,
      render: (row) => <MemberStatusBadge status={row.status} />,
    },
  ];

  return (
    <DataTable
      data={sponsors}
      columns={columns}
      getRowId={(row) => row.id}
      onRowClick={(row) => router.push(`/dashboard/admin/sponsors/${row.id}`)}
      searchPlaceholder="Search by name or email..."
      searchAccessor={(row) => `${row.full_name} ${row.email}`}
      filters={[
        {
          key: "status",
          label: "Status",
          accessor: (row) => row.status,
          options: STATUSES.map((s) => ({
            label: s.charAt(0).toUpperCase() + s.slice(1),
            value: s,
          })),
        },
        {
          key: "sponsorship_type",
          label: "Type",
          accessor: (row) => row.sponsorship_type,
          options: Object.entries(TYPE_LABELS).map(([value, label]) => ({
            label,
            value,
          })),
        },
      ]}
      emptyMessage="No sponsors yet."
    />
  );
}
