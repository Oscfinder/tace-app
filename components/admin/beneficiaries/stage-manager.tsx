"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { STAGE_ORDER, STAGE_LABELS } from "@/lib/beneficiary-stages";
import { updateBeneficiaryStage } from "@/lib/admin/beneficiaries-actions";
import type { Database } from "@/types/database";

type Stage =
  Database["public"]["Tables"]["beneficiaries"]["Row"]["current_stage"];

export function StageManager({
  beneficiaryId,
  currentStage,
}: {
  beneficiaryId: string;
  currentStage: Stage;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>(currentStage);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!note.trim()) {
      setError("A short note is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await updateBeneficiaryStage({
      beneficiaryId,
      newStage: stage,
      note,
    });
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setNote("");
    toast.add({ title: "Stage updated", type: "success" });
    router.refresh();
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          setStage(currentStage);
          setError(null);
          setOpen(true);
        }}
      >
        <ArrowUpRight className="size-4" />
        Move Stage
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move Stage</DialogTitle>
            <DialogDescription>
              Currently: {STAGE_LABELS[currentStage]}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
                New Stage
              </label>
              <Select
                value={stage}
                onValueChange={(v) => {
                  if (v) setStage(v as Stage);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STAGE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
                Note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Why is this stage changing?"
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            {error ? <p className="text-sm text-tace-red">{error}</p> : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={submitting}>
              {submitting ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
