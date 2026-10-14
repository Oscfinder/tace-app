"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthCard } from "@/components/forms/auth-card";
import { SubmitButton } from "@/components/forms/submit-button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/auth/password-actions";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(values: ForgotPasswordInput) {
    await requestPasswordReset(values.email);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <AuthCard title="Check Your Email">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-tace-blue/15 text-tace-blue">
            <Mail className="size-7" />
          </div>
          <p className="text-sm text-tace-gray">
            If an account exists for that email, we&apos;ve sent a link to reset
            your password. It may take a few minutes to arrive.
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot Password?"
      description="Enter your email and we'll send you a link to reset it."
      topLinkPrompt="Remembered it?"
      topLinkLabel="Sign in"
      topLinkHref="/login"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
          />
          <FieldError>{errors.email?.message}</FieldError>
        </Field>
        <SubmitButton
          type="submit"
          loading={isSubmitting}
          className="mt-5 h-[52px] w-full rounded-[13px] bg-gradient-to-r from-tace-blue to-[#19B7F5] text-[15px] font-extrabold shadow-[0_10px_25px_rgba(7,155,234,0.18)] hover:opacity-95"
        >
          Send Reset Link
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
