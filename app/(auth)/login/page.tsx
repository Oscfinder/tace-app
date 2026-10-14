"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { signIn } from "@/lib/auth/actions";

const QUERY_ERROR_MESSAGES: Record<string, string> = {
  invalid_link: "That link is invalid or has expired. Please try again.",
  oauth_failed: "Google sign-in didn't complete. Please try again.",
  account_inactive: "Your account is inactive. Contact TACE support.",
  account_suspended: "Your account is suspended. Contact TACE support.",
};

function LoginQueryError() {
  const searchParams = useSearchParams();
  const queryError = searchParams.get("error");
  const message = queryError
    ? (QUERY_ERROR_MESSAGES[queryError] ?? null)
    : null;
  if (searchParams.get("reset") === "success" && !message) {
    return (
      <p
        role="status"
        className="mb-5 rounded-lg bg-tace-green/10 px-3 py-2.5 text-sm text-tace-green"
      >
        Your password has been updated. Please sign in.
      </p>
    );
  }
  if (!message) return null;
  return (
    <div className="mb-5">
      <FormError message={message} />
    </div>
  );
}

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const result = await signIn(values);
    if (result && "error" in result) {
      setServerError(result.error);
    }
  }

  return (
    <AuthCard
      title="Welcome Back"
      description="Log in to your TACE account and continue making a difference."
      topLinkPrompt="New here?"
      topLinkLabel="Create an account"
      topLinkHref="/signup/member"
      activeTab="login"
    >
      <Suspense fallback={null}>
        <LoginQueryError />
      </Suspense>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
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
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              {...register("password")}
            />
            <FieldError>{errors.password?.message}</FieldError>
          </Field>
          <div className="flex items-center justify-between text-[13px] text-tace-gray">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="size-4 accent-tace-blue" />
              Remember me
            </label>
            <Link href="/forgot-password" className="font-bold text-tace-blue">
              Forgot password?
            </Link>
          </div>
          <FormError message={serverError} />
          <SubmitButton
            type="submit"
            loading={isSubmitting}
            className="h-[52px] w-full rounded-[13px] bg-gradient-to-r from-tace-blue to-[#19B7F5] text-[15px] font-extrabold shadow-[0_10px_25px_rgba(7,155,234,0.18)] hover:opacity-95"
          >
            Sign In
          </SubmitButton>
        </FieldGroup>
      </form>

      <div className="my-6 flex items-center gap-4 text-xs text-tace-gray">
        <span className="h-px flex-1 bg-[#dbe5f1]" />
        or
        <span className="h-px flex-1 bg-[#dbe5f1]" />
      </div>
      <GoogleButton label="Continue with Google" />
    </AuthCard>
  );
}
