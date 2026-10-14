const STYLES: Record<string, string> = {
  pending: "bg-tace-yellow/15 text-tace-yellow",
  approved: "bg-tace-green/15 text-tace-green",
  rejected: "bg-tace-red/15 text-tace-red",
  flagged: "bg-[#FFE8D1] text-[#C2650A]",
};

const LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  flagged: "Flagged",
};

export function ApplicationStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
        STYLES[status] ?? "bg-tace-lgray text-tace-gray"
      }`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
