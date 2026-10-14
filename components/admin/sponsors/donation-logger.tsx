"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { logDonation } from "@/lib/admin/sponsors-actions";
import type {
  ActiveSponsorOption,
  BeneficiaryOption,
  ProjectOption,
} from "@/lib/admin/sponsors";

const NONE_VALUE = "__none__";

/** Only defaults when the sponsor has exactly one linked child — zero or
 * more than one both leave the field for the admin to fill in themselves. */
function defaultBeneficiaryFor(
  sponsorId: string,
  sponsors: ActiveSponsorOption[],
): string {
  const sponsor = sponsors.find((s) => s.id === sponsorId);
  if (sponsor?.linkedBeneficiaryCount === 1 && sponsor.linkedBeneficiaryId) {
    return sponsor.linkedBeneficiaryId;
  }
  return NONE_VALUE;
}

export function DonationLogger({
  sponsors,
  beneficiaries,
  projects,
  lockedSponsorId,
  lockedSponsorName,
}: {
  sponsors: ActiveSponsorOption[];
  beneficiaries: BeneficiaryOption[];
  projects: ProjectOption[];
  lockedSponsorId?: string;
  lockedSponsorName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [sponsorId, setSponsorId] = useState(lockedSponsorId ?? NONE_VALUE);
  const [projectId, setProjectId] = useState(NONE_VALUE);
  const [beneficiaryId, setBeneficiaryId] = useState(() =>
    lockedSponsorId
      ? defaultBeneficiaryFor(lockedSponsorId, sponsors)
      : NONE_VALUE,
  );
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [bankRef, setBankRef] = useState("");
  const [mismatchAcknowledged, setMismatchAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentSponsor = sponsors.find((s) => s.id === sponsorId);
  const chosenBeneficiary = beneficiaries.find((b) => b.id === beneficiaryId);
  const hasMismatch = Boolean(
    currentSponsor &&
    currentSponsor.linkedBeneficiaryCount === 1 &&
    currentSponsor.linkedBeneficiaryId &&
    beneficiaryId !== NONE_VALUE &&
    beneficiaryId !== currentSponsor.linkedBeneficiaryId,
  );

  function reset() {
    setDonorName("");
    setDonorEmail("");
    setDonorPhone("");
    setSponsorId(lockedSponsorId ?? NONE_VALUE);
    setProjectId(NONE_VALUE);
    setBeneficiaryId(
      lockedSponsorId
        ? defaultBeneficiaryFor(lockedSponsorId, sponsors)
        : NONE_VALUE,
    );
    setAmount("");
    setPurpose("");
    setBankRef("");
    setMismatchAcknowledged(false);
    setError(null);
  }

  async function handleSubmit() {
    if (hasMismatch && !mismatchAcknowledged) return;
    setSubmitting(true);
    setError(null);
    const result = await logDonation({
      donorName,
      donorEmail: donorEmail || null,
      donorPhone: donorPhone || null,
      sponsorId: sponsorId === NONE_VALUE ? null : sponsorId,
      projectId: projectId === NONE_VALUE ? null : projectId,
      beneficiaryId: beneficiaryId === NONE_VALUE ? null : beneficiaryId,
      amount: Number(amount),
      purpose: purpose || null,
      bankRef: bankRef || null,
      confirmedMismatch: mismatchAcknowledged,
    });
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setOpen(false);
    reset();
    toast.add({ title: "Donation logged", type: "success" });
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Log Donation
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Log a Donation</DialogTitle>
            <DialogDescription>
              Record a bank transfer confirmed by email.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
                Donor Name
              </label>
              <Input
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
                Donor Email (optional)
              </label>
              <Input
                type="email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
                Donor Phone (optional)
              </label>
              <Input
                value={donorPhone}
                onChange={(e) => setDonorPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
                Linked Sponsor (optional)
              </label>
              {lockedSponsorId ? (
                <Input value={lockedSponsorName ?? ""} disabled />
              ) : (
                <Select
                  value={sponsorId}
                  onValueChange={(v) => {
                    const id = v ?? NONE_VALUE;
                    setSponsorId(id);
                    setBeneficiaryId(defaultBeneficiaryFor(id, sponsors));
                    setMismatchAcknowledged(false);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No sponsor (one-time donor)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>
                      No sponsor (one-time donor)
                    </SelectItem>
                    {sponsors.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
                Beneficiary (optional)
              </label>
              <Select
                value={beneficiaryId}
                onValueChange={(v) => {
                  setBeneficiaryId(v ?? NONE_VALUE);
                  setMismatchAcknowledged(false);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Not earmarked" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Not earmarked</SelectItem>
                  {beneficiaries.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.first_name} {b.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentSponsor?.linkedBeneficiaryCount === 1 &&
              currentSponsor.linkedBeneficiaryName ? (
                <p className="mt-1 text-xs text-tace-gray/70">
                  Linked to {currentSponsor.linkedBeneficiaryName}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
                Project (optional)
              </label>
              <Select
                value={projectId}
                onValueChange={(v) => setProjectId(v ?? NONE_VALUE)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
                Amount (₦)
              </label>
              <Input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
                Purpose (optional)
              </label>
              <Input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
                Bank Reference (optional)
              </label>
              <Input
                value={bankRef}
                onChange={(e) => setBankRef(e.target.value)}
              />
            </div>
          </div>

          {hasMismatch && !mismatchAcknowledged && currentSponsor ? (
            <div className="rounded-lg border border-tace-yellow/40 bg-tace-yellow/10 p-3">
              <p className="text-sm text-tace-navy">
                This sponsor is linked to{" "}
                <strong>{currentSponsor.linkedBeneficiaryName}</strong>. Log
                this donation against{" "}
                <strong>
                  {chosenBeneficiary
                    ? `${chosenBeneficiary.first_name} ${chosenBeneficiary.last_name}`
                    : "this child"}
                </strong>{" "}
                anyway?
              </p>
              <div className="mt-2.5 flex gap-2.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setBeneficiaryId(currentSponsor.linkedBeneficiaryId!)
                  }
                >
                  Use {currentSponsor.linkedBeneficiaryName}
                </Button>
                <Button size="sm" onClick={() => setMismatchAcknowledged(true)}>
                  Yes, Log Anyway
                </Button>
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm text-tace-red">{error}</p> : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || (hasMismatch && !mismatchAcknowledged)}
            >
              {submitting ? "Logging..." : "Log Donation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
