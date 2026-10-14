"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import {
  applicationBase,
  sectionsFor,
  validateSections,
} from "@/lib/validations/application";
import type { Database } from "@/types/database";

type Result =
  { success: true; reference: string } | { error: string; field?: string };

const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 24 * 60 * 60 * 1000;

const payloadSchema = z.object({
  id: z.string().uuid(),
  photoPath: z.string(),
  // Honeypot: real people never see or fill this.
  website: z.string().optional(),
  data: z.unknown(),
});

const isProd = process.env.NODE_ENV === "production";

function hashIp(ip: string, salt: string) {
  // Only the hash is ever stored — never the raw address. The salt is a long
  // random secret, so the small IPv4 space can't be brute-forced from a leak.
  return createHash("sha256").update(`${ip}:${salt}`).digest("hex");
}

// Which header to trust matters: a spoofable one lets anyone dodge the limit,
// a missing one makes everybody share a single bucket.
//  - x-vercel-forwarded-for: set by Vercel's edge, cannot be supplied by the client.
//  - x-forwarded-for (first entry): the client on Vercel (it overwrites the header)
//    and on most proxies; only trustworthy behind a proxy that sets it.
//  - x-real-ip: last resort.
async function clientIp(): Promise<string | null> {
  const h = await headers();
  return (
    h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    (isProd ? null : "127.0.0.1") // local dev has no proxy headers
  );
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}

const blank = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

export async function submitApplication(input: {
  id: string;
  photoPath: string;
  website?: string;
  data: unknown;
}): Promise<Result> {
  const payload = payloadSchema.safeParse(input);
  if (!payload.success)
    return { error: "Something went wrong. Please try again." };
  const { id, photoPath, website } = payload.data;

  // Bots fill hidden fields. Pretend it worked, store nothing.
  if (website && website.trim() !== "") {
    return { success: true, reference: id.slice(0, 8).toUpperCase() };
  }

  // Re-validate everything on the server — the client is never trusted.
  const raw = (payload.data.data ?? {}) as Record<string, unknown>;
  const type = raw.applicant_type;
  const issues = validateSections(
    raw,
    sectionsFor(
      type === "self" || type === "guardian" || type === "organisation"
        ? type
        : undefined,
    ),
  );
  const parsed = applicationBase.safeParse(raw);
  if (issues.length > 0 || !parsed.success) {
    const issue = issues[0];
    return {
      error: issue?.message ?? "Please check your answers and try again.",
      field: issue?.field,
    };
  }
  const d = parsed.data;

  // The photo path must be exactly applications/{this id}/photo.{jpg|png}.
  const pathOk = new RegExp(`^applications/${id}/photo\\.(jpg|png)$`).test(
    photoPath,
  );
  if (!pathOk)
    return { error: "The photo upload didn't complete. Please try again." };

  const admin = createAdminClient();

  // The photo is required: confirm it really landed in storage. (Bucket
  // settings enforce the 5MB / jpg+png limits; anon can't read it back, so
  // the service role checks existence only.)
  const { data: files } = await admin.storage
    .from("beneficiary-photos")
    .list(`applications/${id}`, { limit: 5 });
  if (!files?.some((f) => photoPath.endsWith(f.name))) {
    return {
      error: "We couldn't find the uploaded photo. Please choose it again.",
    };
  }

  // Rate limit: 3 submissions per IP per 24h. application_submissions has RLS
  // with no policies, so only the service role can touch it.
  // Fail closed in production if the salt is missing or the IP can't be
  // determined, rather than silently weakening the limit.
  const salt = process.env.IP_HASH_SALT || (isProd ? null : "dev-only-salt");
  const ip = await clientIp();
  if (!salt || !ip) {
    console.error(
      !salt
        ? "IP_HASH_SALT is not set — refusing applications until it is."
        : "Could not determine client IP — refusing application.",
    );
    return {
      error:
        "We couldn't process your application right now. Please try again shortly.",
    };
  }
  const ipHash = hashIp(ip, salt);
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const { count } = await admin
    .from("application_submissions")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);
  if ((count ?? 0) >= RATE_LIMIT) {
    return {
      error:
        "We've received several applications from this connection today. Please try again tomorrow, or contact us if you need help.",
    };
  }

  const isGuardianish = d.applicant_type !== "self";
  const isOrg = d.applicant_type === "organisation";
  const inSchool = d.edu_status === "in_school";

  // Only sections that apply to this applicant type are saved; everything
  // else is stored as null even if the client sent it.
  const row: Database["public"]["Tables"]["applications"]["Insert"] = {
    id,
    applicant_type: d.applicant_type,
    child_first_name: d.child_first_name,
    child_last_name: d.child_last_name,
    child_dob: d.child_dob,
    child_gender: d.child_gender,
    child_nationality: d.child_nationality,
    child_state: d.child_state,
    child_address: d.child_address,
    child_phone: blank(d.child_phone),
    child_email: blank(d.child_email),
    child_photo_url: photoPath,

    guardian_name: isGuardianish ? blank(d.guardian_name) : null,
    guardian_relationship: isGuardianish
      ? blank(d.guardian_relationship)
      : null,
    guardian_phone: isGuardianish ? blank(d.guardian_phone) : null,
    guardian_email: isGuardianish ? blank(d.guardian_email) : null,
    guardian_address: isGuardianish ? blank(d.guardian_address) : null,
    guardian_occupation: isGuardianish ? blank(d.guardian_occupation) : null,

    org_name: isOrg ? blank(d.org_name) : null,
    org_contact_name: isOrg ? blank(d.org_contact_name) : null,
    org_contact_role: isOrg ? blank(d.org_contact_role) : null,
    org_phone: isOrg ? blank(d.org_phone) : null,
    org_email: isOrg ? blank(d.org_email) : null,
    org_identification: isOrg ? blank(d.org_identification) : null,

    edu_status: d.edu_status,
    school_name: inSchool ? blank(d.school_name) : null,
    class_level: inSchool ? blank(d.class_level) : null,
    school_address: inSchool ? blank(d.school_address) : null,
    academic_performance: d.academic_performance ?? null,
    learning_difficulties: blank(d.learning_difficulties),

    living_situation: d.living_situation,
    siblings_count: d.siblings_count ? Number(d.siblings_count) : null,
    household_income: d.household_income,
    challenges: d.challenges,

    support_types: d.support_types,
    support_description: blank(d.support_description),

    interests: blank(d.interests),
    aspirations: d.aspirations,
    subjects_skills: blank(d.subjects_skills),
    talents: blank(d.talents),

    health_conditions: blank(d.health_conditions),
    disabilities: blank(d.disabilities),
    current_treatment: blank(d.current_treatment),

    consent_information: true,
    consent_contact: true,
    consent_assessment: true,
    consent_no_guarantee: true,
    // Optional: false unless the family explicitly ticked it.
    consent_photography: d.consent_photography === true,
    declarant_name: d.declarant_name,
    declared_at: new Date().toISOString(),

    status: "pending",
  };

  // Normal (anon-capable) server client, NOT the service role: RLS applies,
  // so the tightened insert policy (status pending, no reviewer fields) is
  // what actually guards this write. No .select() — anon can't read back.
  const supabase = await createClient();
  const { error: insertError } = await supabase
    .from("applications")
    .insert(row);
  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "This application was already submitted." };
    }
    console.error("Application insert failed:", insertError.message);
    return { error: "We couldn't save your application. Please try again." };
  }

  await admin.from("application_submissions").insert({ ip_hash: ipHash });

  const reference = id.slice(0, 8).toUpperCase();
  const contactEmail =
    d.applicant_type === "self"
      ? blank(d.child_email)
      : d.applicant_type === "organisation"
        ? (blank(d.org_email) ?? blank(d.guardian_email))
        : blank(d.guardian_email);

  if (contactEmail) {
    try {
      await sendEmail({
        to: contactEmail,
        subject: `TACE Foundation — we received ${d.child_first_name}'s application`,
        html: `<p>Thank you for applying to TACE Welfare Foundation.</p>
<p>We have received the application for <strong>${escapeHtml(d.child_first_name)}</strong>. Your reference is <strong>${reference}</strong>.</p>
<p>We will contact you within 7 days. Please keep this reference if you need to get in touch.</p>
<p>Submitting an application does not guarantee support. Every application is carefully reviewed.</p>`,
      });
    } catch (err) {
      // The application is saved; a failed email must not look like a failed submission.
      console.error("Application confirmation email failed:", err);
    }
  }

  return { success: true, reference };
}
