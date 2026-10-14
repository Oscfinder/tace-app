const STYLES: Record<string, string> = {
  draft: "bg-tace-lgray text-tace-gray",
  active: "bg-tace-green/15 text-tace-green",
  completed: "bg-[#E8F6FD] text-tace-blue",
  archived: "bg-tace-red/15 text-tace-red",
};

export function ProjectStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
        STYLES[status] ?? "bg-tace-lgray text-tace-gray"
      }`}
    >
      {status}
    </span>
  );
}
