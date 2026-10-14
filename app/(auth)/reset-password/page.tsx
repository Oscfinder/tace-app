"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthCard } from "@/components/forms/auth-card";
import { FormError } from "@/components/forms/form-error";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/client";
import { resetPassword } from "@/lib/auth/password-actions";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });
type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Supabase's own hosted links (e.g. admin.generateLink, used for the
// Ticket 2B approval email) redirect here with the session in a URL
// fragment (#access_token=...&type=recovery) rather than a token_hash query
// param — fragments never reach the server, so this has to run client-side.
// Arriving via app/auth/confirm/route.ts instead (the email-template flow)
// already has the session set in cookies and skips straight to "ready".
export default function ResetPasswordPage() {
  const [status, setStatus] = useState<"checking" | "ready" | "expired">(
    "checking",
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const supabase = createClient();

    async function establishSession() {
      const hash = window.location.hash;
      if (hash.includes("access_token")) {
        const params = new URLSearchParams(hash.slice(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        }
        window.history.replaceState(null, "", window.location.pathname);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setStatus(user ? "ready" : "expired");
    }

    establishSession();
  }, []);

  async function onSubmit(values: ResetPasswordInput) {
    setServerError(null);
    const result = await resetPassword(values.password);
    if (result && "error" in result) {
      setServerError(result.error);
    }
  }

  if (status === "checking") {
    return (
      <AuthCard title="Reset Password">
        <p className="text-sm text-tace-gray">Checking your link...</p>
      </AuthCard>
    );
  }

  if (status === "expired") {
    return (
      <AuthCard title="Link Expired">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-tace-gray">
            This password reset link is invalid or has expired.
          </p>
          <Button render={<Link href="/forgot-password" />} className="w-full">
            Request a New Link
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset Password"
      description="Choose a new password for your account."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">New Password</FieldLabel>
          <PasswordInput id="password" {...register("password")} />
          <FieldError>{errors.password?.message}</FieldError>
        </Field>
        <Field className="mt-4" data-invalid={!!errors.confirm_password}>
          <FieldLabel htmlFor="confirm_password">Confirm Password</FieldLabel>
          <PasswordInput
            id="confirm_password"
            {...register("confirm_password")}
          />
          <FieldError>{errors.confirm_password?.message}</FieldError>
        </Field>
        <div className="mt-4">
          <FormError message={serverError} />
        </div>
        <SubmitButton
          type="submit"
          loading={isSubmitting}
          className="mt-5 h-[52px] w-full rounded-[13px] bg-gradient-to-r from-tace-blue to-[#19B7F5] text-[15px] font-extrabold shadow-[0_10px_25px_rgba(7,155,234,0.18)] hover:opacity-95"
        >
          Reset Password
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
