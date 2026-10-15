import { VETTING_LABELS } from "@/lib/mentoring/constants";

const VETTING_STYLE = {
  pending: "bg-[#fff5d9] text-[#b27a00]",
  cleared: "bg-[#ddf8ef] text-[#08aa7a]",
  rejected: "bg-[#ffecef] text-[#f45b69]",
} as const;

export function VettingBadge({
  status,
}: {
  status: keyof typeof VETTING_LABELS;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${VETTING_STYLE[status]}`}
    >
      {VETTING_LABELS[status]}
    </span>
  );
}

const MATCH_STYLE: Record<string, string> = {
  pending_consent: "bg-[#fff5d9] text-[#b27a00]",
  active: "bg-[#ddf8ef] text-[#08aa7a]",
  paused: "bg-[#eee8ff] text-[#7759e8]",
  completed: "bg-[#e4f5ff] text-[#0795e8]",
  terminated: "bg-[#ffecef] text-[#f45b69]",
};
const MATCH_LABEL: Record<string, string> = {
  pending_consent: "Awaiting consent",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  terminated: "Ended",
};

export function MatchStatusBadge({ status }: { status: string | null }) {
  const key = status ?? "pending_consent";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${MATCH_STYLE[key] ?? ""}`}
    >
      {MATCH_LABEL[key] ?? key}
    </span>
  );
}
