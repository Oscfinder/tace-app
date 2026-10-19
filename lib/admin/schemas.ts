import { z } from "zod";
import { STAGE_ORDER } from "@/lib/beneficiary-stages";

// Shared input rules for admin Server Actions. A Server Action is a public
// HTTP endpoint, so the types in a function signature prove nothing about what
// a caller actually sends: every action checks its input against one of these
// before touching the database or storage.

export const INVALID_REQUEST = { error: "Invalid request." } as const;

export const uuid = z.string().uuid();
const nullableUuid = uuid.nullable();
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const money = z.number().finite().min(0).max(1_000_000_000);
const text = (max: number) => z.string().max(max);
const optionalText = (max: number) => z.string().max(max).nullish();
const stage = z.enum(STAGE_ORDER);

export const applicationNotesInput = z.object({ id: uuid, notes: text(4000) });

export const approveInput = z.object({
  applicationId: uuid,
  currentStage: stage,
  mentorId: nullableUuid,
});
export const rejectInput = z.object({ applicationId: uuid, reason: text(1000) });
export const flagInput = z.object({ applicationId: uuid, note: text(1000) });

export const stageInput = z.object({
  beneficiaryId: uuid,
  newStage: stage,
  note: text(1000),
});
export const assignMentorInput = z.object({ beneficiaryId: uuid, mentorId: uuid });
export const interventionInput = z.object({
  beneficiaryId: uuid,
  type: z.string().trim().min(1).max(100),
  amount: money.nullable(),
  description: text(2000),
  date: day,
});

export const storyFields = z.object({
  title: z.string().max(200),
  content: z.string().max(30000),
  excerpt: z.string().max(500).nullable(),
  beneficiaryId: nullableUuid,
});
export const announcementInput = z.object({
  title: z.string().max(200),
  content: z.string().max(5000),
});
export const idToggleInput = z.object({ id: uuid, publish: z.boolean() });

export const memberAssignmentInput = z.object({
  profileId: uuid,
  memberType: z.enum(["trustee", "member"]).nullable(),
  committee: optionalText(100),
  trusteeRole: optionalText(100),
});

export const projectInput = z.object({
  title: z.string().max(200),
  description: optionalText(5000),
  targetAmount: money.nullable(),
  startDate: day.nullable(),
  endDate: day.nullable(),
});
export const attachInput = z.object({
  projectId: uuid,
  beneficiaryId: uuid,
  supportType: optionalText(100),
  amountNeeded: money.nullable(),
});

export const activateSponsorInput = z.object({
  sponsorId: uuid,
  profileId: uuid,
  beneficiaryId: uuid,
});
export const donationInput = z.object({
  donorName: z.string().max(150),
  donorEmail: z.string().email().max(200).nullable(),
  donorPhone: optionalText(30),
  sponsorId: nullableUuid,
  projectId: nullableUuid,
  beneficiaryId: nullableUuid,
  amount: money,
  purpose: optionalText(300),
  bankRef: optionalText(100),
  confirmedMismatch: z.boolean().optional(),
});

// A file name from the browser is untrusted: it could hold "../" or slashes
// that change which storage folder the file lands in. Keep letters, digits,
// dot, dash and underscore only, and keep the extension.
export function safeFileName(original: string): string {
  const dot = original.lastIndexOf(".");
  const ext = dot > 0 ? original.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) : "";
  const base = (dot > 0 ? original.slice(0, dot) : original)
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80);
  return `${base || "file"}${ext ? `.${ext}` : ""}`;
}
