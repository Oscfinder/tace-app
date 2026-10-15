"use client";

import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { MemberStatusBadge } from "@/components/admin/members/member-badges";
import { VettingBadge } from "@/components/admin/mentors/badges";
import { STATUSES } from "@/types/roles";
import { TRACK_LABELS, VETTING_LABELS } from "@/lib/mentoring/constants";
import type { MentorListRow } from "@/lib/admin/mentors";

export function MentorsTable({ mentors }: { mentors: MentorListRow[] }) {
  const router = useRouter();

  const columns: DataTableColumn<MentorListRow>[] = [
    {
      key: "full_name",
      header: "Name",
      accessor: (row) => row.full_name,
      sortable: true,
    },
    {
      key: "profession",
      header: "Profession",
      accessor: (row) => row.profession ?? "—",
    },
    {
      key: "mentor_track",
      header: "Track",
      accessor: (row) => (row.mentor_track ? TRACK_LABELS[row.mentor_track] : "—"),
    },
    {
      key: "vetting_status",
      header: "Vetting",
      accessor: (row) => row.vetting_status,
      render: (row) => <VettingBadge status={row.vetting_status} />,
    },
    {
      key: "account_status",
      header: "Account",
      accessor: (row) => row.account_status,
      render: (row) => <MemberStatusBadge status={row.account_status} />,
    },
    {
      key: "activeMentees",
      header: "Active mentees",
      accessor: (row) => row.activeMentees,
      sortable: true,
    },
  ];

  return (
    <DataTable
      data={mentors}
      columns={columns}
      getRowId={(row) => row.id}
      onRowClick={(row) => router.push(`/dashboard/admin/mentors/${row.id}`)}
      searchPlaceholder="Search by name, email or profession..."
      searchAccessor={(row) => `${row.full_name} ${row.email} ${row.profession ?? ""}`}
      filters={[
        {
          key: "mentor_track",
          label: "Track",
          accessor: (row) => row.mentor_track,
          options: [
            { label: "Career", value: "career" },
            { label: "Tech", value: "tech" },
          ],
        },
        {
          key: "vetting_status",
          label: "Vetting",
          accessor: (row) => row.vetting_status,
          options: (Object.keys(VETTING_LABELS) as (keyof typeof VETTING_LABELS)[]).map((v) => ({
            label: VETTING_LABELS[v],
            value: v,
          })),
        },
        {
          key: "account_status",
          label: "Account status",
          accessor: (row) => row.account_status,
          options: STATUSES.map((s) => ({
            label: s.charAt(0).toUpperCase() + s.slice(1),
            value: s,
          })),
        },
      ]}
      emptyMessage="No mentors have signed up yet."
    />
  );
}
