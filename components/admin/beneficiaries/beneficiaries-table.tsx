"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { StageBadge } from "@/components/admin/beneficiaries/stage-badge";
import { calculateAge } from "@/lib/age";
import { STAGE_ORDER, STAGE_LABELS } from "@/lib/beneficiary-stages";
import type { BeneficiaryListRow } from "@/lib/admin/beneficiaries";

const SUPPORT_OPTIONS = [
  "Education Support",
  "Vocational Training",
  "Mentorship",
  "Healthcare",
  "Emergency Welfare",
];

export function BeneficiariesTable({
  beneficiaries,
}: {
  beneficiaries: BeneficiaryListRow[];
}) {
  const router = useRouter();

  const stateOptions = useMemo(() => {
    const states = new Set(
      beneficiaries
        .map((b) => b.state_of_origin)
        .filter((s): s is string => Boolean(s)),
    );
    return Array.from(states).sort();
  }, [beneficiaries]);

  const columns: DataTableColumn<BeneficiaryListRow>[] = [
    {
      key: "photo",
      header: "Photo",
      render: (row) =>
        row.photoUrl ? (
          <Image
            src={row.photoUrl}
            alt=""
            width={36}
            height={36}
            className="size-9 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-9 items-center justify-center rounded-full bg-tace-lgray text-tace-gray">
            <User className="size-4" />
          </span>
        ),
    },
    {
      key: "name",
      header: "Name",
      accessor: (row) => `${row.first_name} ${row.last_name}`,
      sortable: true,
    },
    {
      key: "age",
      header: "Age",
      accessor: (row) => calculateAge(row.date_of_birth),
      render: (row) => calculateAge(row.date_of_birth),
    },
    {
      key: "current_stage",
      header: "Stage",
      accessor: (row) => row.current_stage,
      render: (row) => <StageBadge stage={row.current_stage} />,
    },
    {
      key: "sponsor_status",
      header: "Sponsor",
      accessor: (row) => (row.sponsor_id ? "Sponsored" : "Unsponsored"),
    },
    {
      key: "mentor_status",
      header: "Mentor",
      accessor: (row) => (row.mentor_id ? "Matched" : "Unmatched"),
    },
    {
      key: "updated_at",
      header: "Last Updated",
      accessor: (row) => row.updated_at,
      render: (row) => new Date(row.updated_at).toLocaleDateString("en-GB"),
      sortable: true,
    },
  ];

  return (
    <DataTable
      data={beneficiaries}
      columns={columns}
      getRowId={(row) => row.id}
      onRowClick={(row) =>
        router.push(`/dashboard/admin/beneficiaries/${row.id}`)
      }
      searchPlaceholder="Search by name..."
      searchAccessor={(row) => `${row.first_name} ${row.last_name}`}
      filters={[
        {
          key: "current_stage",
          label: "Stage",
          accessor: (row) => row.current_stage,
          options: STAGE_ORDER.map((s) => ({
            label: STAGE_LABELS[s],
            value: s,
          })),
        },
        {
          key: "support_needed",
          label: "Support Needed",
          accessor: (row) => row.support_needed,
          options: SUPPORT_OPTIONS.map((s) => ({ label: s, value: s })),
        },
        {
          key: "sponsor_status",
          label: "Sponsor Status",
          accessor: (row) => (row.sponsor_id ? "Sponsored" : "Unsponsored"),
          options: [
            { label: "Sponsored", value: "Sponsored" },
            { label: "Unsponsored", value: "Unsponsored" },
          ],
        },
        {
          key: "mentor_status",
          label: "Mentor Status",
          accessor: (row) => (row.mentor_id ? "Matched" : "Unmatched"),
          options: [
            { label: "Matched", value: "Matched" },
            { label: "Unmatched", value: "Unmatched" },
          ],
        },
        {
          key: "state_of_origin",
          label: "State",
          accessor: (row) => row.state_of_origin,
          options: stateOptions.map((s) => ({ label: s, value: s })),
        },
      ]}
      emptyMessage="No beneficiaries yet."
    />
  );
}
