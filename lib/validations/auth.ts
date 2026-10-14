import { z } from "zod";

// Nigerian phone numbers: optional leading +234/234, or local 0-prefixed,
// followed by a 9/10-digit subscriber number.
const nigerianPhoneRegex = /^(\+?234|0)[789][01]\d{8}$/;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const COMMITTEE_PREFERENCES = [
  "Education & Programs",
  "Welfare & Care",
  "Finance & Fundraising",
  "Communications & Media",
  "Outreach & Partnerships",
  "Spiritual & Mentorship",
  "Legal & Compliance",
  "Enterprise & Training",
  "Health & Medical Outreach",
] as const;

export const TRUSTEE_ROLES = [
  "Chairman",
  "Secretary / Legal",
  "Care & Welfare",
  "Education & Programs",
  "Spiritual & Chaplaincy",
  "Outreach & Partnerships",
  "Communications",
  "Finance & Administration",
  "Health & Medical",
] as const;

export const trusteeRoleSchema = z.enum(TRUSTEE_ROLES);

export const memberSignupSchema = z
  .object({
    full_name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    phone: z
      .string()
      .regex(nigerianPhoneRegex, "Enter a valid Nigerian phone number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
    occupation: z.string().min(1, "Enter your occupation"),
    committee_preference: z.string().min(1, "Select a committee"),
    reason_for_joining: z.string().min(1, "Tell us why you want to join"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const sponsorSignupSchema = z
  .object({
    full_name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    phone: z
      .string()
      .regex(nigerianPhoneRegex, "Enter a valid Nigerian phone number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
    beneficiary_id: z.string().uuid().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const MENTOR_TRACKS = ["career", "tech"] as const;
export const MENTOR_AVAILABILITY = [
  "weekdays",
  "weekends",
  "both",
  "flexible",
] as const;
export const MENTOR_AGE_GROUPS = [
  "6-10",
  "11-14",
  "15-18",
  "no_preference",
] as const;

export const mentorSignupSchema = z
  .object({
    full_name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    phone: z
      .string()
      .regex(nigerianPhoneRegex, "Enter a valid Nigerian phone number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
    mentor_track: z.enum(MENTOR_TRACKS, {
      message: "Select a mentorship track",
    }),
    profession: z.string().min(1, "Enter your profession"),
    expertise: z.string().optional(),
    availability: z.enum(MENTOR_AVAILABILITY).optional(),
    preferred_age_group: z.enum(MENTOR_AGE_GROUPS).optional(),
    motivation: z.string().min(1, "Tell us why you want to mentor"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

// "Complete your profile" after Google sign-in: the same role-specific fields
// as each signup form, minus email/password. Only these three roles exist
// here — admin and beneficiary are not representable in this schema.
export const SELF_SERVE_ROLES = ["member", "sponsor", "mentor"] as const;

const completeProfileBase = {
  full_name: z.string().trim().min(2, "Enter your full name"),
  phone: z
    .string()
    .regex(nigerianPhoneRegex, "Enter a valid Nigerian phone number"),
};

export const completeProfileSchema = z.discriminatedUnion("role", [
  z.object({
    ...completeProfileBase,
    role: z.literal("member"),
    occupation: z.string().trim().min(1, "Enter your occupation"),
    committee_preference: z.string().min(1, "Select a committee"),
    reason_for_joining: z.string().trim().min(1, "Tell us why you want to join"),
  }),
  z.object({
    ...completeProfileBase,
    role: z.literal("sponsor"),
  }),
  z.object({
    ...completeProfileBase,
    role: z.literal("mentor"),
    mentor_track: z.enum(MENTOR_TRACKS, {
      message: "Select a mentorship track",
    }),
    profession: z.string().trim().min(1, "Enter your profession"),
    expertise: z.string().optional(),
    availability: z.enum(MENTOR_AVAILABILITY).optional(),
    preferred_age_group: z.enum(MENTOR_AGE_GROUPS).optional(),
    motivation: z.string().trim().min(1, "Tell us why you want to mentor"),
  }),
]);

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
export type LoginInput =z.infer<typeof loginSchema>;
export type MemberSignupInput = z.infer<typeof memberSignupSchema>;
export type SponsorSignupInput = z.infer<typeof sponsorSignupSchema>;
export type MentorSignupInput = z.infer<typeof mentorSignupSchema>;
