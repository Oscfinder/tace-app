"use client";

import { useMemo, useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ALL_VALUE = "__all__";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  /** Raw value used for default rendering and sorting; omit if `render` fully replaces the cell. */
  accessor?: (row: T) => string | number | null | undefined;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

export type DataTableFilter<T> = {
  key: string;
  label: string;
  options: { label: string; value: string }[];
  accessor: (row: T) => string | null | undefined;
};

export function DataTable<T>({
  data,
  columns,
  filters,
  searchPlaceholder,
  searchAccessor,
  onRowClick,
  pageSize = 10,
  emptyMessage = "No results.",
  getRowId,
}: {
  data: T[];
  columns: DataTableColumn<T>[];
  filters?: DataTableFilter<T>[];
  searchPlaceholder?: string;
  searchAccessor?: (row: T) => string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  emptyMessage?: string;
  getRowId: (row: T) => string;
}) {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let rows = data;

    if (search.trim() && searchAccessor) {
      const term = search.trim().toLowerCase();
      rows = rows.filter((row) =>
        searchAccessor(row).toLowerCase().includes(term),
      );
    }

    for (const filter of filters ?? []) {
      const value = filterValues[filter.key];
      if (value && value !== ALL_VALUE) {
        rows = rows.filter((row) => filter.accessor(row) === value);
      }
    }

    if (sortKey) {
      const column = columns.find((c) => c.key === sortKey);
      if (column?.accessor) {
        rows = [...rows].sort((a, b) => {
          const av = column.accessor!(a) ?? "";
          const bv = column.accessor!(b) ?? "";
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;
          return sortDir === "asc" ? cmp : -cmp;
        });
      }
    }

    return rows;
  }, [
    data,
    search,
    searchAccessor,
    filters,
    filterValues,
    sortKey,
    sortDir,
    columns,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  function toggleSort(key: string) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-4">
      {(searchAccessor || (filters && filters.length > 0)) && (
        <div className="flex flex-wrap items-center gap-3">
          {searchAccessor ? (
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder ?? "Search..."}
              className="max-w-xs"
            />
          ) : null}
          {(filters ?? []).map((filter) => (
            <Select
              key={filter.key}
              value={filterValues[filter.key] ?? ALL_VALUE}
              onValueChange={(value) => {
                setFilterValues((prev) => ({
                  ...prev,
                  [filter.key]: value ?? ALL_VALUE,
                }));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All {filter.label}</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className="flex items-center gap-1 font-semibold"
                    >
                      {column.header}
                      {sortKey === column.key ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="size-3.5" />
                        ) : (
                          <ArrowDown className="size-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3.5 text-tace-gray/50" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-10 text-center text-sm text-tace-gray"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow
                  key={getRowId(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render
                        ? column.render(row)
                        : (column.accessor?.(row) ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-tace-gray">
          <span>
            Page {page} of {totalPages} · {filtered.length} result
            {filtered.length === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
