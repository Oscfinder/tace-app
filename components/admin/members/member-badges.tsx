const STATUS_STYLES: Record<string, string> = {
  pending: "bg-tace-yellow/15 text-tace-yellow",
  active: "bg-tace-green/15 text-tace-green",
  inactive: "bg-tace-lgray text-tace-gray",
  suspended: "bg-tace-red/15 text-tace-red",
};

export function MemberStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
        STATUS_STYLES[status] ?? "bg-tace-lgray text-tace-gray"
      }`}
    >
      {status}
    </span>
  );
}

export function MemberTypeBadge({ type }: { type: string | null }) {
  if (!type) {
    return (
      <span className="inline-flex items-center rounded-full bg-tace-lgray px-2.5 py-1 text-xs font-bold text-tace-gray">
        Unassigned
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
        type === "trustee"
          ? "bg-[#F1EFFB] text-[#7759E8]"
          : "bg-[#E8F6FD] text-tace-blue"
      }`}
    >
      {type === "trustee" ? "Trustee" : "Member"}
    </span>
  );
}
