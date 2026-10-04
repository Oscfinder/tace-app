export const ROLES = [
  "admin",
  "member",
  "sponsor",
  "mentor",
  "beneficiary",
] as const;
export type Role = (typeof ROLES)[number];

export const STATUSES = ["pending", "active", "inactive", "suspended"] as const;
export type Status = (typeof STATUSES)[number];

export const MEMBER_TYPES = ["trustee", "member"] as const;
export type MemberType = (typeof MEMBER_TYPES)[number];
