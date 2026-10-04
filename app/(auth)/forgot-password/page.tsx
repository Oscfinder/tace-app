import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthCard } from "@/components/forms/auth-card";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Forgot Password?">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-tace-blue/15 text-tace-blue">
          <Mail className="size-7" />
        </div>
        <p className="text-sm text-tace-gray">
          Password reset isn&apos;t available yet. In the meantime, email{" "}
          <a
            href="mailto:tacefoundationinfo@gmail.com"
            className="font-medium text-tace-blue"
          >
            tacefoundationinfo@gmail.com
          </a>{" "}
          and we&apos;ll help you regain access to your account.
        </p>
        <Button
          render={<Link href="/login" />}
          variant="outline"
          className="w-full"
        >
          Back to Sign In
        </Button>
      </div>
    </AuthCard>
  );
}
