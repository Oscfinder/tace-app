"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
  sponsorSignupSchema,
  type SponsorSignupInput,
} from "@/lib/validations/auth";
import { signUpSponsor } from "@/lib/auth/actions";

export default function SponsorSignupPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SponsorSignupInput>({
    resolver: zodResolver(sponsorSignupSchema),
  });

  async function onSubmit(values: SponsorSignupInput) {
    setServerError(null);
    const result = await signUpSponsor(values);
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
          admin will review your application and link your sponsored child, and
          you&apos;ll receive an approval email.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create Your Sponsor Account"
      description="Beneficiary linking is done by an admin after approval."
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
      <GoogleButton label="Sign up with Google" />
    </AuthCard>
  );
}
