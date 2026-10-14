import { z } from "zod";
import { calculateAge } from "@/lib/age";
import {
  ACADEMIC_PERFORMANCE,
  CHALLENGES,
  EDU_STATUSES,
  GENDERS,
  HOUSEHOLD_INCOME,
  LIVING_SITUATIONS,
  SUPPORT_TYPES,
} from "@/lib/apply/options";

const phoneRegex = /^(\+?234|0)[789][01]\d{8}$/;
const phoneMsg = "Enter a valid Nigerian phone number, e.g. 08012345678";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES = { "image/jpeg": "jpg", "image/png": "png" } as const;

const text = (label: string, max = 200) =>
  z.string().trim().min(1, `${label} is required`).max(max, "That's too long");
const optionalText = (max = 1000) =>
  z.string().trim().max(max, "That's too long").optional();
const optionalPhone = z
  .string()
  .trim()
  .refine((v) => v === "" || phoneRegex.test(v), phoneMsg)
  .optional();
const email = z.string().trim().email("Enter a valid email address");
const optionalEmail = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || z.string().email().safeParse(v).success,
    "Enter a valid email address",
  )
  .optional();

const values = <T extends readonly { value: string }[]>(opts: T) =>
  opts.map((o) => o.value) as [T[number]["value"], ...T[number]["value"][]];

/**
 * Field-level rules for every field. Rules that depend on the applicant type
 * (guardian/organisation/school details) live in conditionalIssues() below so
 * they can run per section: Zod skips object-level refinements while any
 * required field elsewhere is still empty, which would hide them mid-form.
 */
export const applicationBase = z.object({
  // 1 — who is applying
  applicant_type: z.enum(["self", "guardian", "organisation"], {
    message: "Please choose who is applying",
  }),

  // 2 — child
  child_first_name: text("First name", 60),
  child_last_name: text("Last name", 60),
  child_dob: z
    .string()
    .min(1, "Date of birth is required")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date")
    .refine(
      (v) => new Date(v) <= new Date(),
      "Date of birth can't be in the future",
    )
    .refine(
      (v) => calculateAge(v) <= 25,
      "TACE supports children and young people up to 25",
    ),
  child_gender: z.enum(values(GENDERS), { message: "Please choose an option" }),
  child_nationality: text("Nationality", 60),
  child_state: z.string().min(1, "Please choose a state"),
  child_address: text("Home address", 300),
  child_phone: optionalPhone,
  child_email: optionalEmail,

  // 3 — guardian (guardian + organisation)
  guardian_name: optionalText(120),
  guardian_relationship: optionalText(60),
  guardian_phone: optionalText(30),
  guardian_email: optionalText(120),
  guardian_address: optionalText(300),
  guardian_occupation: optionalText(120),

  // 4 — organisation (organisation only)
  org_name: optionalText(150),
  org_contact_name: optionalText(120),
  org_contact_role: optionalText(120),
  org_phone: optionalText(30),
  org_email: optionalText(120),
  org_identification: optionalText(200),

  // 5 — education
  edu_status: z.enum(values(EDU_STATUSES), {
    message: "Please choose an option",
  }),
  school_name: optionalText(150),
  class_level: optionalText(60),
  school_address: optionalText(300),
  academic_performance: z.enum(values(ACADEMIC_PERFORMANCE)).optional(),
  learning_difficulties: optionalText(500),

  // 6 — household
  living_situation: z.enum(values(LIVING_SITUATIONS), {
    message: "Please choose an option",
  }),
  siblings_count: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || (/^\d{1,2}$/.test(v) && Number(v) <= 30),
      "Enter a number from 0 to 30",
    )
    .optional(),
  household_income: z.enum(values(HOUSEHOLD_INCOME), {
    message: "Please choose an option",
  }),
  challenges: z.array(z.enum(CHALLENGES)),

  // 7 — support needed
  support_types: z
    .array(z.enum(SUPPORT_TYPES))
    .min(1, "Choose at least one kind of support"),
  support_description: optionalText(1000),

  // 8 — interests & aspirations
  interests: optionalText(500),
  aspirations: text("Please tell us what they hope to become", 500),
  subjects_skills: optionalText(500),
  talents: optionalText(500),

  // 9 — health (all optional, plain wording)
  health_conditions: optionalText(500),
  disabilities: optionalText(500),
  current_treatment: optionalText(500),

  // 10 — consent & declaration. Four are required; photography is optional.
  consent_information: z.literal(true, {
    message: "Please confirm the information is accurate",
  }),
  consent_contact: z.literal(true, {
    message: "Please allow us to contact you",
  }),
  consent_assessment: z.literal(true, {
    message: "Please agree to the assessment",
  }),
  consent_no_guarantee: z.literal(true, {
    message: "Please acknowledge there is no guarantee",
  }),
  consent_photography: z.boolean(),
  declarant_name: text("Your full name", 120),
});

export type ApplicationInput = z.infer<typeof applicationBase>;

// Which fields belong to which screen — drives per-step validation and the
// "hidden sections are not submitted" rule.
export const SECTION_FIELDS = {
  applicant: ["applicant_type"],
  child: [
    "child_first_name",
    "child_last_name",
    "child_dob",
    "child_gender",
    "child_nationality",
    "child_state",
    "child_address",
    "child_phone",
    "child_email",
  ],
  guardian: [
    "guardian_name",
    "guardian_relationship",
    "guardian_phone",
    "guardian_email",
    "guardian_address",
    "guardian_occupation",
  ],
  organisation: [
    "org_name",
    "org_contact_name",
    "org_contact_role",
    "org_phone",
    "org_email",
    "org_identification",
  ],
  education: [
    "edu_status",
    "school_name",
    "class_level",
    "school_address",
    "academic_performance",
    "learning_difficulties",
  ],
  household: [
    "living_situation",
    "siblings_count",
    "household_income",
    "challenges",
  ],
  support: ["support_types", "support_description"],
  aspirations: ["interests", "aspirations", "subjects_skills", "talents"],
  health: ["health_conditions", "disabilities", "current_treatment"],
  consent: [
    "consent_information",
    "consent_contact",
    "consent_assessment",
    "consent_no_guarantee",
    "consent_photography",
    "declarant_name",
  ],
} as const satisfies Record<string, readonly (keyof ApplicationInput)[]>;

export type SectionKey = keyof typeof SECTION_FIELDS;

export function sectionsFor(
  type: ApplicationInput["applicant_type"] | undefined,
): SectionKey[] {
  const all: SectionKey[] = ["applicant", "child"];
  if (type && type !== "self") all.push("guardian");
  if (type === "organisation") all.push("organisation");
  all.push(
    "education",
    "household",
    "support",
    "aspirations",
    "health",
    "consent",
  );
  return all;
}

export type Issue = { field: keyof ApplicationInput; message: string };

type Values = Partial<Record<keyof ApplicationInput, unknown>>;
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

// Rules that depend on what the applicant chose. Only called for sections
// that are actually shown, so a hidden section can never block submission.
function conditionalIssues(section: SectionKey, v: Values): Issue[] {
  const issues: Issue[] = [];
  const need = (field: keyof ApplicationInput, label: string) => {
    if (!str(v[field])) issues.push({ field, message: `${label} is required` });
  };

  if (section === "child" && v.applicant_type === "self") {
    // The child's own email becomes their login, so it is required here.
    need("child_email", "Your email address");
  }

  if (section === "guardian") {
    need("guardian_name", "Parent or guardian's name");
    need("guardian_relationship", "Relationship to the child");
    need("guardian_address", "Address");
    if (!phoneRegex.test(str(v.guardian_phone))) {
      issues.push({ field: "guardian_phone", message: phoneMsg });
    }
    if (!email.safeParse(str(v.guardian_email)).success) {
      issues.push({
        field: "guardian_email",
        message: "Enter a valid email address",
      });
    }
  }

  if (section === "organisation") {
    need("org_name", "Organisation name");
    need("org_contact_name", "Contact person's name");
    need("org_contact_role", "Contact person's role");
    if (!phoneRegex.test(str(v.org_phone))) {
      issues.push({ field: "org_phone", message: phoneMsg });
    }
    if (!email.safeParse(str(v.org_email)).success) {
      issues.push({
        field: "org_email",
        message: "Enter a valid email address",
      });
    }
  }

  if (section === "education" && v.edu_status === "in_school") {
    need("school_name", "School name");
    need("class_level", "Class or level");
  }

  return issues;
}

/**
 * Validate the given sections (the client passes one at a time on "Next"; the
 * server passes every section shown for the chosen applicant type). Returns
 * one issue per field, in form order.
 */
export function validateSections(
  values: Values,
  sections: SectionKey[],
): Issue[] {
  const base = applicationBase.safeParse(values);
  const baseIssues = base.success
    ? []
    : base.error.issues.map((i) => ({
        field: i.path[0] as keyof ApplicationInput,
        message: i.message,
      }));

  const out: Issue[] = [];
  const seen = new Set<string>();
  for (const section of sections) {
    const fields = SECTION_FIELDS[
      section
    ] as readonly (keyof ApplicationInput)[];
    const candidates = [
      ...baseIssues.filter((i) => fields.includes(i.field)),
      ...conditionalIssues(section, values),
    ];
    for (const issue of candidates) {
      if (!seen.has(issue.field)) {
        seen.add(issue.field);
        out.push(issue);
      }
    }
  }
  return out;
}
