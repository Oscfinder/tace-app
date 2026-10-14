"use client";

import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import {
  MemberStatusBadge,
  MemberTypeBadge,
} from "@/components/admin/members/member-badges";
import { COMMITTEE_PREFERENCES } from "@/lib/validations/auth";
import { STATUSES } from "@/types/roles";
import type { MemberRow } from "@/lib/admin/members";

export function MembersTable({ members }: { members: MemberRow[] }) {
  const router = useRouter();

  const columns: DataTableColumn<MemberRow>[] = [
    {
      key: "full_name",
      header: "Name",
      accessor: (row) => row.full_name,
      sortable: true,
    },
    { key: "email", header: "Email", accessor: (row) => row.email },
    {
      key: "member_type",
      header: "Type",
      accessor: (row) => row.member_type,
      render: (row) => <MemberTypeBadge type={row.member_type} />,
    },
    {
      key: "committee",
      header: "Committee",
      accessor: (row) => row.committee ?? "—",
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
      data={members}
      columns={columns}
      getRowId={(row) => row.id}
      onRowClick={(row) => router.push(`/dashboard/admin/members/${row.id}`)}
      searchPlaceholder="Search by name or email..."
      searchAccessor={(row) => `${row.full_name} ${row.email}`}
      filters={[
        {
          key: "member_type",
          label: "Type",
          accessor: (row) => row.member_type,
          options: [
            { label: "Trustee", value: "trustee" },
            { label: "Member", value: "member" },
          ],
        },
        {
          key: "committee",
          label: "Committee",
          accessor: (row) => row.committee,
          options: COMMITTEE_PREFERENCES.map((c) => ({ label: c, value: c })),
        },
        {
          key: "status",
          label: "Status",
          accessor: (row) => row.status,
          options: STATUSES.map((s) => ({
            label: s.charAt(0).toUpperCase() + s.slice(1),
            value: s,
          })),
        },
      ]}
      emptyMessage="No members yet."
    />
  );
}
