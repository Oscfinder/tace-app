// Shared by the admin mentor screens, match creation and the mentor dashboard.

// A mentor can have at most this many mentees (active, or awaiting consent).
export const MAX_ACTIVE_MENTEES = 5;

// The four things an admin confirms before clearing a mentor.
export const VETTING_ITEMS = [
  { key: "identity", label: "Identity checked" },
  { key: "references", label: "Two references received" },
  { key: "background", label: "Character or background check done" },
  { key: "interview", label: "Interview done" },
] as const;
export type VettingKey = (typeof VETTING_ITEMS)[number]["key"];
export type VettingChecklist = Partial<Record<VettingKey, boolean>>;

export function checklistComplete(c: VettingChecklist | null | undefined) {
  return VETTING_ITEMS.every((i) => c?.[i.key] === true);
}

// Mentor "preferred age group" values (from signup) mapped from a child's age.
export type AgeGroup = "6-10" | "11-14" | "15-18";
export function ageGroupFor(age: number): AgeGroup | null {
  if (age >= 6 && age <= 10) return "6-10";
  if (age >= 11 && age <= 14) return "11-14";
  if (age >= 15 && age <= 18) return "15-18";
  return null;
}

export const TRACK_LABELS = { career: "Career", tech: "Tech" } as const;
export const VETTING_LABELS = {
  pending: "Pending",
  cleared: "Cleared",
  rejected: "Rejected",
} as const;
