"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { FileText } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import type { StoryListRow } from "@/lib/admin/content";

export function StoriesTable({ stories }: { stories: StoryListRow[] }) {
  const router = useRouter();

  const columns: DataTableColumn<StoryListRow>[] = [
    {
      key: "photo",
      header: "",
      render: (row) =>
        row.photoUrl ? (
          <Image
            src={row.photoUrl}
            alt=""
            width={36}
            height={36}
            className="size-9 rounded-lg object-cover"
          />
        ) : (
          <span className="flex size-9 items-center justify-center rounded-lg bg-tace-lgray text-tace-gray">
            <FileText className="size-4" />
          </span>
        ),
    },
    {
      key: "title",
      header: "Title",
      accessor: (row) => row.title,
      sortable: true,
    },
    {
      key: "beneficiary",
      header: "Linked Child",
      accessor: (row) => row.beneficiaryName ?? "—",
    },
    {
      key: "is_published",
      header: "Status",
      accessor: (row) => (row.is_published ? "Published" : "Draft"),
    },
    {
      key: "created_at",
      header: "Date",
      accessor: (row) => row.created_at,
      render: (row) => new Date(row.created_at).toLocaleDateString("en-GB"),
      sortable: true,
    },
  ];

  return (
    <DataTable
      data={stories}
      columns={columns}
      getRowId={(row) => row.id}
      onRowClick={(row) =>
        router.push(`/dashboard/admin/content/stories/${row.id}`)
      }
      searchPlaceholder="Search by title..."
      searchAccessor={(row) => row.title}
      filters={[
        {
          key: "is_published",
          label: "Status",
          accessor: (row) => (row.is_published ? "Published" : "Draft"),
          options: [
            { label: "Published", value: "Published" },
            { label: "Draft", value: "Draft" },
          ],
        },
      ]}
      emptyMessage="No stories yet."
    />
  );
}
