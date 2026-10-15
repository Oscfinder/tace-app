"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { MemberStatusBadge } from "@/components/admin/members/member-badges";
import { activateMentorAccount } from "@/lib/admin/mentors-actions";

// Activating the account is its own step and only possible once cleared. The
// server action and the UI both check; clearing alone never logs anyone in.
export function AccountPanel({
  mentorId,
  accountStatus,
  cleared,
  codeAcceptedAt,
}: {
  mentorId: string;
  accountStatus: "pending" | "active" | "inactive" | "suspended";
  cleared: boolean;
  codeAcceptedAt: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function activate() {
    setBusy(true);
    setError(null);
    const result = await activateMentorAccount({ mentorId });
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({ title: "Account activated", description: "The mentor has been emailed.", type: "success" });
    router.refresh();
  }

  return (
    <section className="rounded-[13px] border border-[#e5edf6] bg-white p-5 shadow-[0_8px_28px_rgba(20,55,95,0.07)]">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-base font-semibold text-tace-navy">Account</h2>
        <MemberStatusBadge status={accountStatus} />
      </div>
      <p className="mt-2 text-sm text-tace-gray">
        {accountStatus === "active"
          ? "This mentor can sign in."
          : cleared
            ? "Cleared by vetting. Activate the account so they can sign in."
            : "Clear this mentor through vetting before their account can be activated."}
      </p>
      <p className="mt-2 text-xs text-tace-gray/80">
        Code of conduct:{" "}
        {codeAcceptedAt
          ? `accepted on ${new Date(codeAcceptedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`
          : "not accepted yet (they must accept it on first sign-in)"}
      </p>
      {accountStatus !== "active" ? (
        <Button onClick={activate} disabled={busy || !cleared} className="mt-3 h-10">
          {busy ? "Activating..." : "Activate account"}
        </Button>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-tace-red">
          {error}
        </p>
      ) : null}
    </section>
  );
}
