"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthCard } from "@/components/forms/auth-card";
import { FormError } from "@/components/forms/form-error";
import { GoogleButton } from "@/components/forms/google-button";
import { PasswordInput } from "@/components/forms/password-input";
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
  MENTOR_AGE_GROUPS,
  MENTOR_AVAILABILITY,
  MENTOR_TRACKS,
  mentorSignupSchema,
  type MentorSignupInput,
} from "@/lib/validations/auth";
import { signUpMentor } from "@/lib/auth/actions";

const TRACK_LABELS: Record<(typeof MENTOR_TRACKS)[number], string> = {
  career: "Career — general professional guidance",
  tech: "Tech — digital skills mentorship",
};

const AVAILABILITY_LABELS: Record<
  (typeof MENTOR_AVAILABILITY)[number],
  string
> = {
  weekdays: "Weekdays",
  weekends: "Weekends",
  both: "Both",
  flexible: "Flexible",
};

const AGE_GROUP_LABELS: Record<(typeof MENTOR_AGE_GROUPS)[number], string> = {
  "6-10": "6–10 years",
  "11-14": "11–14 years",
  "15-18": "15–18 years",
  no_preference: "No preference",
};

export default function MentorSignupPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MentorSignupInput>({ resolver: zodResolver(mentorSignupSchema) });

  async function onSubmit(values: MentorSignupInput) {
    setServerError(null);
    const result = await signUpMentor(values);
    if ("error" in result) {
      setServerError(result.error);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <AuthCard title="Thank You for Applying!">
        <p className="text-sm text-tace-gray">
          Please check your email to verify your account. Once verified, an
          admin will review your application and match you to a child, and
          you&apos;ll receive an approval email.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Become a TACE Mentor"
      description="Share your time and expertise to guide a child's journey."
      topLinkPrompt="Already have an account?"
      topLinkLabel="Sign in"
      topLinkHref="/login"
      activeTab="signup"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field data-invalid={!!errors.full_name}>
            <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
            <Input id="full_name" {...register("full_name")} />
            <FieldError>{errors.full_name?.message}</FieldError>
          </Field>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" {...register("email")} />
            <FieldError>{errors.email?.message}</FieldError>
          </Field>
          <Field data-invalid={!!errors.phone}>
            <FieldLabel htmlFor="phone">Phone</FieldLabel>
            <Input
              id="phone"
              placeholder="08012345678"
              {...register("phone")}
            />
            <FieldError>{errors.phone?.message}</FieldError>
          </Field>
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <PasswordInput id="password" {...register("password")} />
            <FieldError>{errors.password?.message}</FieldError>
          </Field>
          <Field data-invalid={!!errors.confirm_password}>
            <FieldLabel htmlFor="confirm_password">Confirm Password</FieldLabel>
            <PasswordInput
              id="confirm_password"
              {...register("confirm_password")}
            />
            <FieldError>{errors.confirm_password?.message}</FieldError>
          </Field>
          <Field data-invalid={!!errors.mentor_track}>
            <FieldLabel>Mentorship Track</FieldLabel>
            <Controller
              control={control}
              name="mentor_track"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a track" />
                  </SelectTrigger>
                  <SelectContent>
                    {MENTOR_TRACKS.map((track) => (
                      <SelectItem key={track} value={track}>
                        {TRACK_LABELS[track]}
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
            <Input id="profession" {...register("profession")} />
            <FieldError>{errors.profession?.message}</FieldError>
          </Field>
          <Field data-invalid={!!errors.expertise}>
            <FieldLabel htmlFor="expertise">Area of Expertise</FieldLabel>
            <Input id="expertise" {...register("expertise")} />
            <FieldError>{errors.expertise?.message}</FieldError>
          </Field>
          <Field data-invalid={!!errors.availability}>
            <FieldLabel>Availability</FieldLabel>
            <Controller
              control={control}
              name="availability"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                  <SelectContent>
                    {MENTOR_AVAILABILITY.map((option) => (
                      <SelectItem key={option} value={option}>
                        {AVAILABILITY_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError>{errors.availability?.message}</FieldError>
          </Field>
          <Field data-invalid={!!errors.preferred_age_group}>
            <FieldLabel>Preferred Age Group</FieldLabel>
            <Controller
              control={control}
              name="preferred_age_group"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select age group" />
                  </SelectTrigger>
                  <SelectContent>
                    {MENTOR_AGE_GROUPS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {AGE_GROUP_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError>{errors.preferred_age_group?.message}</FieldError>
          </Field>
          <Field data-invalid={!!errors.motivation}>
            <FieldLabel htmlFor="motivation">
              Why do you want to mentor?
            </FieldLabel>
            <textarea
              id="motivation"
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              {...register("motivation")}
            />
            <FieldError>{errors.motivation?.message}</FieldError>
          </Field>
          <FormError message={serverError} />
          <SubmitButton
            type="submit"
            loading={isSubmitting}
            className="h-[52px] w-full rounded-[13px] bg-gradient-to-r from-tace-blue to-[#19B7F5] text-[15px] font-extrabold shadow-[0_10px_25px_rgba(7,155,234,0.18)] hover:opacity-95"
          >
            Create Account
          </SubmitButton>
        </FieldGroup>
      </form>

      <div className="my-6 flex items-center gap-4 text-xs text-tace-gray">
        <span className="h-px flex-1 bg-[#dbe5f1]" />
        or
        <span className="h-px flex-1 bg-[#dbe5f1]" />
      </div>
      <GoogleButton label="Sign up with Google" intent="mentor" />
    </AuthCard>
  );
}
