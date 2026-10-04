import Link from "next/link";
import { Clock } from "lucide-react";
import { requireAuth } from "@/lib/auth/guards";
import { signOut } from "@/lib/auth/actions";
import { AuthCard } from "@/components/forms/auth-card";
import { Button } from "@/components/ui/button";

export default async function PendingPage() {
  const { profile } = await requireAuth();

  return (
    <AuthCard title={`Hi ${profile.full_name}!`}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-tace-yellow/15 text-tace-yellow">
          <Clock className="size-7" />
        </div>
        <p className="text-sm text-tace-gray">
          Your account is being reviewed. You&apos;ll receive an email once
          you&apos;re approved. This usually takes 1-2 business days.
        </p>
        <div className="flex w-full flex-col gap-2">
          <Button
            render={<Link href="/" />}
            variant="outline"
            className="w-full"
          >
            Return to Home
          </Button>
          <form action={signOut}>
            <Button type="submit" variant="ghost" className="w-full">
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </AuthCard>
  );
}
