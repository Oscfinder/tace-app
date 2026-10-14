"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormError } from "@/components/forms/form-error";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COMMITTEE_PREFERENCES,
  MENTOR_AGE_GROUPS,
  MENTOR_AVAILABILITY,
  MENTOR_TRACKS,
  SELF_SERVE_ROLES,
  completeProfileSchema,
  type CompleteProfileInput,
} from "@/lib/validations/auth";
import { completeProfile } from "@/lib/auth/complete-profile-action";

type SelfServeRole = (typeof SELF_SERVE_ROLES)[number];

const ROLE_LABELS: Record<SelfServeRole, string> = {
  member: "Member — join the foundation's volunteer team",
  sponsor: "Sponsor — support a child's journey",
  mentor: "Mentor — guide a child with your expertise",
};
const TRACK_LABELS: Record<(typeof MENTOR_TRACKS)[number], string> = {
  career: "Career — general professional guidance",
  tech: "Tech — digital skills mentorship",
};
const AVAILABILITY_LABELS: Record<(typeof MENTOR_AVAILABILITY)[number], string> =
  { weekdays: "Weekdays", weekends: "Weekends", both: "Both", flexible: "Flexible" };
const AGE_GROUP_LABELS: Record<(typeof MENTOR_AGE_GROUPS)[number], string> = {
  "6-10": "6–10 years",
  "11-14": "11–14 years",
  "15-18": "15–18 years",
  no_preference: "No preference",
};

const textareaClass =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

// The three role variants have different field sets; react-hook-form reads
// fields off one loosely-typed shape and zod (the discriminated union) is the
// real validator, so errors are looked up through this permissive view.
type AnyErrors = Record<string, { message?: string } | undefined>;

export function CompleteProfileForm({
  initialRole,
  initialName,
}: {
  initialRole: SelfServeRole;
  initialName: string;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    unregister,
    formState: { errors: rawErrors, isSubmitting },
  } = useForm<CompleteProfileInput>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: { role: initialRole, full_name: initialName } as CompleteProfileInput,
  });
  const errors = rawErrors as unknown as AnyErrors;
  const role = useWatch({ control, name: "role" });

  async function onSubmit(values: CompleteProfileInput) {
    setServerError(null);
    const result = await completeProfile(values);
    if (result && "error" in result) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel>I want to join as</FieldLabel>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(next) => {
                  // Drop the other roles' field values so they aren't validated.
                  (
                    [
                      "occupation",
                      "committee_preference",
                      "reason_for_joining",
                      "mentor_track",
                      "profession",
                      "expertise",
                      "availability",
                      "preferred_age_group",
                      "motivation",
                    ] as const
                  ).forEach((name) =>
                    unregister(name as never, { keepDefaultValue: false }),
                  );
                  field.onChange(next);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SELF_SERVE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field data-invalid={!!errors.full_name}>
          <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
          <Input id="full_name" autoComplete="name" {...register("full_name")} />
          <FieldError>{errors.full_name?.message}</FieldError>
        </Field>
        <Field data-invalid={!!errors.phone}>
          <FieldLabel htmlFor="phone">Phone</FieldLabel>
          <Input
            id="phone"
            type="tel"
            placeholder="08012345678"
            autoComplete="tel"
            {...register("phone")}
          />
          <FieldError>{errors.phone?.message}</FieldError>
        </Field>

        {role === "member" ? (
          <>
            <Field data-invalid={!!errors.occupation}>
              <FieldLabel htmlFor="occupation">Occupation</FieldLabel>
              <Input id="occupation" {...register("occupation" as never)} />
              <FieldError>{errors.occupation?.message}</FieldError>
            </Field>
            <Field data-invalid={!!errors.committee_preference}>
              <FieldLabel>Committee Preference</FieldLabel>
              <Controller
                control={control}
                name={"committee_preference" as never}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a committee" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMITTEE_PREFERENCES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{errors.committee_preference?.message}</FieldError>
            </Field>
            <Field data-invalid={!!errors.reason_for_joining}>
              <FieldLabel htmlFor="reason_for_joining">
                Why do you want to join?
              </FieldLabel>
              <textarea
                id="reason_for_joining"
                rows={3}
                className={textareaClass}
                {...register("reason_for_joining" as never)}
              />
              <FieldError>{errors.reason_for_joining?.message}</FieldError>
            </Field>
          </>
        ) : null}

        {role === "mentor" ? (
          <>
            <Field data-invalid={!!errors.mentor_track}>
              <FieldLabel>Mentorship Track</FieldLabel>
              <Controller
                control={control}
                name={"mentor_track" as never}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a track" />
                    </SelectTrigger>
                    <SelectContent>
                      {MENTOR_TRACKS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TRACK_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{errors.mentor_track?.message}</FieldError>
            </Field>
            <Field data-invalid={!!errors.profession}>
              <FieldLabel htmlFor="profession">Profession</FieldLabel>
              <Input id="profession" {...register("profession" as never)} />
              <FieldError>{errors.profession?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="expertise">Area of Expertise</FieldLabel>
              <Input id="expertise" {...register("expertise" as never)} />
            </Field>
            <Field>
              <FieldLabel>Availability</FieldLabel>
              <Controller
                control={control}
                name={"availability" as never}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      {MENTOR_AVAILABILITY.map((o) => (
                        <SelectItem key={o} value={o}>
                          {AVAILABILITY_LABELS[o]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field>
              <FieldLabel>Preferred Age Group</FieldLabel>
              <Controller
                control={control}
                name={"preferred_age_group" as never}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select age group" />
                    </SelectTrigger>
                    <SelectContent>
                      {MENTOR_AGE_GROUPS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {AGE_GROUP_LABELS[o]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field data-invalid={!!errors.motivation}>
              <FieldLabel htmlFor="motivation">
                Why do you want to mentor?
              </FieldLabel>
              <textarea
                id="motivation"
                rows={3}
                className={textareaClass}
                {...register("motivation" as never)}
              />
              <FieldError>{errors.motivation?.message}</FieldError>
            </Field>
          </>
        ) : null}

        <FormError message={serverError} />
        <SubmitButton
          type="submit"
          loading={isSubmitting}
          className="h-[52px] w-full rounded-[13px] bg-gradient-to-r from-tace-blue to-[#19B7F5] text-[15px] font-extrabold shadow-[0_10px_25px_rgba(7,155,234,0.18)] hover:opacity-95"
        >
          Continue
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
