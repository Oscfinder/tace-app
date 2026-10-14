"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { activateSponsor } from "@/lib/admin/sponsors-actions";
import type { UnsponsoredBeneficiary } from "@/lib/admin/sponsors";

export function SponsorActivationPanel({
  sponsorId,
  profileId,
  beneficiaries,
}: {
  sponsorId: string;
  profileId: string;
  beneficiaries: UnsponsoredBeneficiary[];
}) {
  const router = useRouter();
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleActivate() {
    if (!beneficiaryId) {
      setError("Choose a child to link this sponsor to.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await activateSponsor({
      sponsorId,
      profileId,
      beneficiaryId,
    });
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({ title: "Sponsor activated", type: "success" });
    router.refresh();
  }

  return (
    <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-5">
      <h3 className="font-heading text-sm font-semibold text-tace-navy">
        Activate Sponsor
      </h3>
      <p className="mt-1 text-xs text-tace-gray/70">
        Link this sponsor to a child before activating.
      </p>
      <div className="mt-3 flex flex-col gap-2.5">
        <Select
          value={beneficiaryId}
          onValueChange={(v) => setBeneficiaryId(v ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a child" />
          </SelectTrigger>
          <SelectContent>
            {beneficiaries.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.first_name} {b.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {beneficiaries.length === 0 ? (
          <p className="text-xs text-tace-gray/70">
            No unsponsored children available right now.
          </p>
        ) : null}
        {error ? <p className="text-sm text-tace-red">{error}</p> : null}
        <Button
          onClick={handleActivate}
          disabled={submitting || beneficiaries.length === 0}
          className="bg-tace-green text-white hover:bg-tace-green/90"
        >
          {submitting ? "Activating..." : "Activate & Link"}
        </Button>
      </div>
    </div>
  );
}
