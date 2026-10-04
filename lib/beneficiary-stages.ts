export const STAGE_ORDER = [
  "identified",
  "assessed",
  "education_support",
  "vocational_training",
  "certification",
  "apprenticeship",
  "savings",
  "employment",
  "business_owner",
] as const;

export const STAGE_LABELS: Record<(typeof STAGE_ORDER)[number], string> = {
  identified: "Identified",
  assessed: "Assessed",
  education_support: "Education Support",
  vocational_training: "Vocational Training",
  certification: "Certification",
  apprenticeship: "Apprenticeship",
  savings: "Savings Programme",
  employment: "Employment",
  business_owner: "Business Owner",
};

export function stageProgress(stage: string) {
  const index = STAGE_ORDER.indexOf(stage as (typeof STAGE_ORDER)[number]);
  const position = index === -1 ? 1 : index + 1;
  return {
    position,
    total: STAGE_ORDER.length,
    percent: Math.round((position / STAGE_ORDER.length) * 100),
    label: STAGE_LABELS[stage as (typeof STAGE_ORDER)[number]] ?? stage,
  };
}
