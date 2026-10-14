"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { CheckCircle2, Loader2, ShieldCheck, Info } from "lucide-react";
import {
  CheckRow,
  FormField,
  NativeSelect,
  RadioCard,
  TextArea,
  TextInput,
} from "@/components/apply/fields";
import { createClient } from "@/lib/supabase/client";
import { submitApplication } from "@/lib/apply/actions";
import { calculateAge } from "@/lib/age";
import {
  ACADEMIC_PERFORMANCE,
  APPLICANT_TYPES,
  CHALLENGES,
  EDU_STATUSES,
  GENDERS,
  HOUSEHOLD_INCOME,
  LIVING_SITUATIONS,
  NIGERIAN_STATES,
  SUPPORT_TYPES,
} from "@/lib/apply/options";
import {
  MAX_PHOTO_BYTES,
  PHOTO_TYPES,
  SECTION_FIELDS,
  sectionsFor,
  validateSections,
  type ApplicationInput,
  type SectionKey,
} from "@/lib/validations/application";

const TITLES: Record<SectionKey, { title: string; intro: string }> = {
  applicant: { title: "Who is applying?", intro: "This tells us which questions to ask next." },
  child: { title: "About the child", intro: "Tell us about the child who needs support." },
  guardian: { title: "Parent or guardian", intro: "Who looks after the child? We will use this to reach you." },
  organisation: { title: "Your organisation", intro: "Tell us about the organisation applying on the child's behalf." },
  education: { title: "Education", intro: "Where is the child with their schooling?" },
  household: { title: "Home life", intro: "This helps us understand the family's situation. Share only what you're comfortable with." },
  support: { title: "Support needed", intro: "What would help the most?" },
  aspirations: { title: "Interests and dreams", intro: "What does the child enjoy and hope to become?" },
  health: { title: "Health (optional)", intro: "Only share what you wish. It helps us give the right care. You can skip this page." },
  consent: { title: "Consent and declaration", intro: "Please read and confirm before you submit." },
};

const REQUIRED_CONSENTS = [
  "consent_information",
  "consent_contact",
  "consent_assessment",
  "consent_no_guarantee",
] as const;

const buttonBase =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50";

export function ApplyForm() {
  const {
    register,
    control,
    getValues,
    setError,
    clearErrors,
    setFocus,
    formState: { errors },
  } = useForm<ApplicationInput>({
    mode: "onTouched",
    shouldUnregister: false,
    defaultValues: {
      challenges: [],
      support_types: [],
      child_nationality: "Nigerian",
      consent_information: false,
      consent_contact: false,
      consent_assessment: false,
      consent_no_guarantee: false,
      consent_photography: false,
    } as unknown as ApplicationInput,
  });

  const applicantType = useWatch({ control, name: "applicant_type" });
  const dob = useWatch({ control, name: "child_dob" });
  const eduStatus = useWatch({ control, name: "edu_status" });
  const consents = useWatch({ control, name: [...REQUIRED_CONSENTS] });

  const sections = sectionsFor(applicantType);
  const [step, setStep] = useState(0);
  const current = sections[Math.min(step, sections.length - 1)];
  const isLast = step >= sections.length - 1;

  // The photo lives in component state only — nothing about the child is ever
  // written to localStorage/sessionStorage.
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const applicationId = useRef<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const err = (name: keyof ApplicationInput) =>
    (errors[name] as { message?: string } | undefined)?.message;

  const age = dob && !Number.isNaN(Date.parse(dob)) ? calculateAge(dob) : null;
  const selfUnder18 = applicantType === "self" && age !== null && age < 18;
  const allRequiredConsents = consents.every(Boolean);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview(null);
    if (!file) return;
    if (!(file.type in PHOTO_TYPES)) {
      setPhotoError("Please choose a JPG or PNG photo. PDFs and other files aren't accepted.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("That photo is larger than 5MB. Please choose a smaller one.");
      e.target.value = "";
      return;
    }
    setPhotoError(null);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function showIssues(sectionList: SectionKey[]) {
    const values = getValues();
    for (const s of sectionList) clearErrors(SECTION_FIELDS[s] as unknown as (keyof ApplicationInput)[]);
    const issues = validateSections(values, sectionList);
    const photoMissing = sectionList.includes("child") && !photo;
    if (photoMissing && !photoError) setPhotoError("A photo of the child is required.");
    for (const issue of issues) {
      setError(issue.field, { type: "manual", message: issue.message });
    }
    return { issues, photoMissing };
  }

  function goTo(index: number) {
    setStep(index);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function next() {
    setFormError(null);
    const { issues, photoMissing } = showIssues([current]);
    if (issues.length > 0 || photoMissing) {
      if (issues[0]) setFocus(issues[0].field);
      return;
    }
    goTo(step + 1);
  }

  async function submit() {
    setFormError(null);
    // Re-check every section that is shown — never the hidden ones.
    const { issues, photoMissing } = showIssues(sections);
    if (issues.length > 0 || photoMissing) {
      const badSection = sections.findIndex(
        (s) =>
          (s === "child" && photoMissing) ||
          (SECTION_FIELDS[s] as readonly string[]).includes(issues[0]?.field ?? ""),
      );
      if (badSection >= 0) goTo(badSection);
      setFormError("Please fix the highlighted answers before submitting.");
      return;
    }
    if (!photo) return;

    setSubmitting(true);
    // Same id for the upload path and the row; kept across retries.
    applicationId.current ??= crypto.randomUUID();
    const id = applicationId.current;
    const ext = PHOTO_TYPES[photo.type as keyof typeof PHOTO_TYPES];
    const photoPath = `applications/${id}/photo.${ext}`;

    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("beneficiary-photos")
      .upload(photoPath, photo, { contentType: photo.type, upsert: false });
    // "already exists" just means a previous attempt got this far — carry on.
    if (uploadError && !/already exists|duplicate/i.test(uploadError.message)) {
      setSubmitting(false);
      setFormError("We couldn't upload the photo. Please check your connection and try again.");
      return;
    }

    const result = await submitApplication({
      id,
      photoPath,
      website: honeypot,
      data: getValues(),
    });
    setSubmitting(false);

    if ("error" in result) {
      setFormError(result.error);
      return;
    }
    setReference(result.reference);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  // ── Confirmation ──────────────────────────────────────────────────────
  if (reference) {
    return (
      <div className="rounded-2xl border border-[#dce7f4] bg-white p-6 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-tace-green/15 text-tace-green">
          <CheckCircle2 className="size-9" />
        </span>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="mt-5 font-heading text-3xl font-extrabold text-tace-navy outline-none"
        >
          Thank you!
        </h2>
        <p className="mx-auto mt-2 max-w-md text-tace-gray">
          Your application has been received. We will contact you within 7 days.
        </p>
        <div className="mx-auto mt-6 max-w-xs rounded-xl bg-[#f2faff] px-5 py-4">
          <p className="text-xs font-semibold tracking-wide text-tace-gray uppercase">Your reference</p>
          <p className="mt-1 font-heading text-2xl font-extrabold tracking-wider text-tace-blue">{reference}</p>
        </div>
        <p className="mx-auto mt-5 max-w-md text-sm text-tace-gray">
          Please keep this reference. Submitting an application does not
          guarantee support. If an email address was given we have sent a
          confirmation there.
        </p>
        <Link
          href="/"
          className={`${buttonBase} mt-7 bg-gradient-to-r from-tace-blue to-[#19B7F5] text-white`}
        >
          Back to home
        </Link>
      </div>
    );
  }

  // ── Field helpers ─────────────────────────────────────────────────────
  const text = (
    name: keyof ApplicationInput,
    label: string,
    opts: {
      required?: boolean;
      hint?: string;
      type?: string;
      autoComplete?: string;
      inputMode?: "text" | "tel" | "email" | "numeric";
      placeholder?: string;
    } = {},
  ) => (
    <FormField id={name} label={label} required={opts.required} hint={opts.hint} error={err(name)}>
      <TextInput
        id={name}
        type={opts.type ?? "text"}
        autoComplete={opts.autoComplete}
        inputMode={opts.inputMode}
        placeholder={opts.placeholder}
        error={err(name)}
        hint={opts.hint}
        {...register(name as never)}
      />
    </FormField>
  );

  const area = (name: keyof ApplicationInput, label: string, opts: { required?: boolean; hint?: string } = {}) => (
    <FormField id={name} label={label} required={opts.required} hint={opts.hint} error={err(name)}>
      <TextArea id={name} error={err(name)} hint={opts.hint} {...register(name as never)} />
    </FormField>
  );

  const select = (
    name: keyof ApplicationInput,
    label: string,
    options: readonly { value: string; label: string }[],
    opts: { required?: boolean; placeholder?: string } = {},
  ) => (
    <FormField id={name} label={label} required={opts.required} error={err(name)}>
      <NativeSelect id={name} options={options} placeholder={opts.placeholder} error={err(name)} {...register(name as never)} />
    </FormField>
  );

  const checkGroup = (
    name: "challenges" | "support_types",
    legend: string,
    options: readonly string[],
    opts: { required?: boolean; hint?: string } = {},
  ) => (
    <fieldset aria-describedby={err(name) ? `${name}-error` : undefined}>
      <legend className="text-sm font-semibold text-tace-navy">
        {legend}
        {opts.required ? <span className="ml-0.5 text-tace-red" aria-hidden>*</span> : <span className="ml-1.5 text-xs font-normal text-tace-gray">(optional)</span>}
      </legend>
      {opts.hint ? <p className="mt-1 text-xs text-tace-gray">{opts.hint}</p> : null}
      <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <CheckRow key={o} label={o} value={o} {...register(name)} />
        ))}
      </div>
      {err(name) ? (
        <p id={`${name}-error`} role="alert" className="mt-2 text-sm font-medium text-tace-red">
          {err(name)}
        </p>
      ) : null}
    </fieldset>
  );

  // ── Sections ──────────────────────────────────────────────────────────
  const body: Record<SectionKey, ReactNode> = {
    applicant: (
      <fieldset aria-describedby={err("applicant_type") ? "applicant_type-error" : undefined}>
        <legend className="sr-only">Who is applying?</legend>
        <div className="grid gap-3">
          {APPLICANT_TYPES.map((t) => (
            <RadioCard key={t.value} label={t.label} hint={t.hint} value={t.value} {...register("applicant_type")} />
          ))}
        </div>
        {err("applicant_type") ? (
          <p id="applicant_type-error" role="alert" className="mt-2 text-sm font-medium text-tace-red">
            {err("applicant_type")}
          </p>
        ) : null}
      </fieldset>
    ),

    child: (
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          {text("child_first_name", "First name", { required: true, autoComplete: "off" })}
          {text("child_last_name", "Last name", { required: true, autoComplete: "off" })}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {text("child_dob", "Date of birth", { required: true, type: "date" })}
          {select("child_gender", "Gender", GENDERS, { required: true })}
        </div>
        {selfUnder18 ? (
          <div role="status" className="flex gap-3 rounded-xl border border-[#cfe6f7] bg-[#f2faff] p-4 text-sm text-tace-navy">
            <Info className="mt-0.5 size-5 shrink-0 text-tace-blue" />
            <p>
              Because you are under 18, TACE will contact a parent or guardian
              before any application is approved. You can still go ahead and apply.
            </p>
          </div>
        ) : null}
        <div className="grid gap-5 sm:grid-cols-2">
          {text("child_nationality", "Nationality", { required: true })}
          {select("child_state", "State of origin", NIGERIAN_STATES.map((s) => ({ value: s, label: s })), { required: true, placeholder: "Choose a state" })}
        </div>
        {area("child_address", "Home address", { required: true })}
        <div className="grid gap-5 sm:grid-cols-2">
          {text("child_phone", "Child's phone", { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "08012345678" })}
          {text("child_email", "Child's email", {
            type: "email",
            inputMode: "email",
            autoComplete: "email",
            required: applicantType === "self",
            hint: applicantType === "self" ? "This will be your login email." : undefined,
          })}
        </div>

        <FormField
          id="photo"
          label="Photo of the child"
          required
          hint="A clear, recent face photo. JPG or PNG, up to 5MB."
          error={photoError ?? undefined}
        >
          <div className="flex items-center gap-4">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="Preview of the chosen photo" className="size-20 shrink-0 rounded-xl object-cover ring-4 ring-[#e5f6ff]" />
            ) : (
              <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-[#e5f6ff] text-xs text-tace-gray" aria-hidden>
                No photo
              </div>
            )}
            <input
              id="photo"
              type="file"
              accept="image/jpeg,image/png"
              onChange={handlePhoto}
              aria-invalid={photoError ? true : undefined}
              aria-describedby={`photo-hint${photoError ? " photo-error" : ""}`}
              className="min-h-12 w-full min-w-0 text-sm file:mr-3 file:min-h-12 file:rounded-xl file:border-0 file:bg-tace-blue file:px-4 file:font-semibold file:text-white"
            />
          </div>
        </FormField>
      </div>
    ),

    guardian: (
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          {text("guardian_name", "Full name", { required: true, autoComplete: "name" })}
          {text("guardian_relationship", "Relationship to the child", { required: true, placeholder: "e.g. Mother, Uncle" })}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {text("guardian_phone", "Phone", { required: true, type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "08012345678" })}
          {text("guardian_email", "Email", { required: true, type: "email", inputMode: "email", autoComplete: "email", hint: "This will be the login email if the application is approved." })}
        </div>
        {area("guardian_address", "Address", { required: true })}
        {text("guardian_occupation", "Occupation")}
      </div>
    ),

    organisation: (
      <div className="grid gap-5">
        {text("org_name", "Organisation name", { required: true })}
        <div className="grid gap-5 sm:grid-cols-2">
          {text("org_contact_name", "Contact person", { required: true, autoComplete: "name" })}
          {text("org_contact_role", "Their role", { required: true, placeholder: "e.g. Head teacher" })}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {text("org_phone", "Phone", { required: true, type: "tel", inputMode: "tel", placeholder: "08012345678" })}
          {text("org_email", "Email", { required: true, type: "email", inputMode: "email" })}
        </div>
        {text("org_identification", "Registration or ID number", { hint: "If your organisation has one." })}
      </div>
    ),

    education: (
      <div className="grid gap-5">
        {select("edu_status", "Schooling status", EDU_STATUSES, { required: true })}
        {eduStatus === "in_school" ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              {text("school_name", "School name", { required: true })}
              {text("class_level", "Class or level", { required: true, placeholder: "e.g. JSS 2" })}
            </div>
            {area("school_address", "School address")}
          </>
        ) : null}
        {select("academic_performance", "How is the child doing in class?", ACADEMIC_PERFORMANCE)}
        {area("learning_difficulties", "Any difficulty with learning?", { hint: "For example reading or concentration. Skip if none." })}
      </div>
    ),

    household: (
      <div className="grid gap-5">
        {select("living_situation", "Who does the child live with?", LIVING_SITUATIONS, { required: true })}
        <div className="grid gap-5 sm:grid-cols-2">
          {text("siblings_count", "Number of brothers and sisters", { type: "number", inputMode: "numeric" })}
          {select("household_income", "Household income", HOUSEHOLD_INCOME, { required: true })}
        </div>
        {checkGroup("challenges", "Which of these does the family face?", CHALLENGES, { hint: "Tick all that apply." })}
      </div>
    ),

    support: (
      <div className="grid gap-5">
        {checkGroup("support_types", "What kind of support is needed?", SUPPORT_TYPES, { required: true, hint: "Tick all that apply." })}
        {area("support_description", "Anything else we should know?")}
      </div>
    ),

    aspirations: (
      <div className="grid gap-5">
        {area("aspirations", "What does the child hope to become?", { required: true })}
        {area("interests", "What do they enjoy?", { hint: "Hobbies, games, favourite things." })}
        {area("subjects_skills", "Favourite subjects or skills")}
        {area("talents", "Any special talents?")}
      </div>
    ),

    health: (
      <div className="grid gap-5">
        {area("health_conditions", "Any health conditions?", { hint: "Only if you wish to share." })}
        {area("disabilities", "Any disability?")}
        {area("current_treatment", "Is the child receiving treatment now?")}
      </div>
    ),

    consent: (
      <div className="grid gap-4">
        {(
          [
            ["consent_information", "I confirm the information I have given is true and accurate."],
            ["consent_contact", "I allow TACE to contact me about this application."],
            ["consent_assessment", "I agree that TACE may assess the child's situation to decide on support."],
            ["consent_no_guarantee", "I understand that applying does not guarantee support."],
          ] as const
        ).map(([name, label]) => (
          <div key={name}>
            <CheckRow label={label} {...register(name)} />
            {err(name) ? <p role="alert" className="mt-1 text-sm font-medium text-tace-red">{err(name)}</p> : null}
          </div>
        ))}

        <div className="rounded-xl border border-[#cfe6f7] bg-[#f2faff] p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-tace-navy">
            <ShieldCheck className="size-5 text-tace-blue" />
            Optional: public profile and photo
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-tace-gray">
            If you tick this box, the child&apos;s first name, age and photo may
            appear on our public website to help find a sponsor. If you leave
            it unticked, they will never appear publicly. Your application is
            treated exactly the same either way.
          </p>
          <div className="mt-3">
            <CheckRow label="Yes, the child's first name, age and photo may be shown publicly." {...register("consent_photography")} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {text("declarant_name", "Type your full name to sign", { required: true, autoComplete: "name" })}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-tace-navy">Date</span>
            <p className="flex min-h-12 items-center rounded-xl bg-[#f3f7fc] px-3.5 text-base text-tace-navy">
              {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>
    ),
  };

  const percent = Math.round(((step + 1) / sections.length) * 100);

  return (
    <div className="rounded-2xl border border-[#dce7f4] bg-white shadow-sm">
      <div className="border-b border-[#eef2f7] px-5 pt-5 pb-4 sm:px-8 sm:pt-7">
        <div className="flex items-center justify-between text-sm font-semibold text-tace-gray">
          <span>
            Step {step + 1} of {sections.length}
          </span>
          <span>{percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Application progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="mt-2 h-2 overflow-hidden rounded-full bg-[#e6edf4]"
        >
          <div className="h-full rounded-full bg-gradient-to-r from-tace-blue to-[#19B7F5] transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isLast) submit();
          else next();
        }}
        noValidate
        className="px-5 py-6 sm:px-8 sm:py-8"
      >
        {/* Honeypot: invisible to people, tempting to bots. */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </label>
        </div>

        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-heading text-2xl font-extrabold text-tace-navy outline-none"
        >
          {TITLES[current].title}
        </h2>
        <p className="mt-1.5 mb-6 text-[15px] text-tace-gray">{TITLES[current].intro}</p>

        {body[current]}

        {formError ? (
          <p role="alert" className="mt-6 rounded-xl bg-tace-red/10 px-4 py-3 text-sm font-medium text-tace-red">
            {formError}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => goTo(step - 1)}
            disabled={step === 0 || submitting}
            className={`${buttonBase} border border-[#d5e1ee] bg-white text-tace-navy hover:bg-[#f7faff] ${step === 0 ? "invisible" : ""}`}
          >
            Back
          </button>
          {isLast ? (
            <button
              type="submit"
              disabled={!allRequiredConsents || submitting}
              className={`${buttonBase} bg-gradient-to-r from-tace-blue to-[#19B7F5] text-white shadow-[0_10px_25px_rgba(7,155,234,0.18)] hover:opacity-95`}
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {submitting ? "Submitting…" : "Submit application"}
            </button>
          ) : (
            <button
              type="submit"
              className={`${buttonBase} bg-gradient-to-r from-tace-blue to-[#19B7F5] text-white shadow-[0_10px_25px_rgba(7,155,234,0.18)] hover:opacity-95`}
            >
              Next
            </button>
          )}
        </div>
        {isLast && !allRequiredConsents ? (
          <p className="mt-3 text-center text-sm text-tace-gray sm:text-right">
            Tick the four required boxes to submit.
          </p>
        ) : null}
      </form>
    </div>
  );
}
