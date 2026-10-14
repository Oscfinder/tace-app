"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
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
import {
  attachBeneficiary,
  detachBeneficiary,
} from "@/lib/admin/projects-actions";
import type {
  AttachedBeneficiary,
  BeneficiaryPickerOption,
} from "@/lib/admin/projects";

export function BeneficiaryAttachment({
  projectId,
  attached,
  unattached,
}: {
  projectId: string;
  attached: AttachedBeneficiary[];
  unattached: BeneficiaryPickerOption[];
}) {
  const router = useRouter();
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [supportType, setSupportType] = useState("");
  const [amountNeeded, setAmountNeeded] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAttach() {
    if (!beneficiaryId) {
      setError("Choose a child first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await attachBeneficiary({
      projectId,
      beneficiaryId,
      supportType: supportType || null,
      amountNeeded: amountNeeded ? Number(amountNeeded) : null,
    });
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setBeneficiaryId("");
    setSupportType("");
    setAmountNeeded("");
    toast.add({ title: "Child attached", type: "success" });
    router.refresh();
  }

  async function handleDetach(id: string) {
    setRemovingId(id);
    const result = await detachBeneficiary(id, projectId);
    setRemovingId(null);
    if ("error" in result) {
      toast.add({
        title: "Couldn't remove",
        description: result.error,
        type: "error",
      });
      return;
    }
    toast.add({ title: "Removed from project", type: "success" });
    router.refresh();
  }

  return (
    <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-6">
      <h2 className="font-heading text-base font-semibold text-tace-navy">
        Attached Children
      </h2>

      {attached.length > 0 ? (
        <div className="mt-4 flex flex-col">
          {attached.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 border-b border-[#F1F3F6] py-3 last:border-b-0"
            >
              <div>
                <Link
                  href={`/dashboard/admin/beneficiaries/${a.beneficiary_id}`}
                  className="text-sm font-semibold text-tace-blue hover:underline"
                >
                  {a.first_name} {a.last_name}
                </Link>
                <div className="mt-0.5 text-xs text-tace-gray/70">
                  {a.support_type ?? "No support type set"}
                  {a.amount_needed
                    ? ` · ₦${Number(a.amount_needed).toLocaleString()} needed`
                    : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDetach(a.id)}
                disabled={removingId === a.id}
                aria-label="Remove from project"
                className="shrink-0 text-tace-gray/50 hover:text-tace-red"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-tace-gray/70">
          No children attached yet.
        </p>
      )}

      <div className="mt-5 grid gap-2.5 border-t border-[#F1F3F6] pt-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
            Attach a Child
          </label>
          <Select
            value={beneficiaryId}
            onValueChange={(v) => setBeneficiaryId(v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a child" />
            </SelectTrigger>
            <SelectContent>
              {unattached.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.first_name} {b.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
            Support Type (optional)
          </label>
          <Input
            value={supportType}
            onChange={(e) => setSupportType(e.target.value)}
            placeholder="e.g. School fees"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
            Amount Needed (₦, optional)
          </label>
          <Input
            type="number"
            min="0"
            value={amountNeeded}
            onChange={(e) => setAmountNeeded(e.target.value)}
          />
        </div>
        {error ? (
          <p className="text-sm text-tace-red sm:col-span-2">{error}</p>
        ) : null}
        <Button
          onClick={handleAttach}
          disabled={submitting || unattached.length === 0}
          className="sm:col-span-2"
        >
          {submitting ? "Attaching..." : "Attach"}
        </Button>
        {unattached.length === 0 ? (
          <p className="text-xs text-tace-gray/70 sm:col-span-2">
            Every beneficiary is already attached to this project.
          </p>
        ) : null}
      </div>
    </div>
  );
}
