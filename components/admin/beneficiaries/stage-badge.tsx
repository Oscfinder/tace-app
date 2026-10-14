import { STAGE_LABELS } from "@/lib/beneficiary-stages";

const COLORS: Record<string, string> = {
  identified: "bg-tace-lgray text-tace-gray",
  assessed: "bg-tace-lgray text-tace-gray",
  education_support: "bg-[#E8F6FD] text-tace-blue",
  vocational_training: "bg-[#E8F6FD] text-tace-blue",
  certification: "bg-tace-yellow/15 text-[#B8860B]",
  apprenticeship: "bg-tace-yellow/15 text-[#B8860B]",
  savings: "bg-tace-green/15 text-tace-green",
  employment: "bg-tace-green/15 text-tace-green",
  business_owner: "bg-tace-green/15 text-tace-green",
};

export function StageBadge({ stage }: { stage: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
        COLORS[stage] ?? "bg-tace-lgray text-tace-gray"
      }`}
    >
      {STAGE_LABELS[stage as keyof typeof STAGE_LABELS] ?? stage}
    </span>
  );
}
