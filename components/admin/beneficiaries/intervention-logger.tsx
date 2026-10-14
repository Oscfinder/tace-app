"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { logIntervention } from "@/lib/admin/beneficiaries-actions";
import type { InterventionRow } from "@/lib/admin/beneficiaries";

const TYPES = ["Educational", "Vocational", "Financial", "Medical", "Other"];

export function InterventionLogger({
  beneficiaryId,
  interventions,
}: {
  beneficiaryId: string;
  interventions: InterventionRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(TYPES[0]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const result = await logIntervention({
      beneficiaryId,
      type,
      amount: amount ? Number(amount) : null,
      description,
      date,
    });
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setAmount("");
    setDescription("");
    toast.add({ title: "Intervention logged", type: "success" });
    router.refresh();
  }

  return (
    <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold text-tace-navy">
          Support History
        </h2>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Log Intervention
        </Button>
      </div>

      {interventions.length > 0 ? (
        <div className="mt-4 flex flex-col">
          {interventions.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 border-b border-[#F1F3F6] py-3 last:border-b-0"
            >
              <div>
                <div className="text-sm font-semibold text-tace-navy">
                  {item.type}
                </div>
                {item.description ? (
                  <div className="mt-0.5 text-sm text-tace-gray">
                    {item.description}
                  </div>
                ) : null}
                <div className="mt-0.5 text-xs text-tace-gray/70">
                  {item.given_at
                    ? new Date(item.given_at).toLocaleDateString("en-GB")
                    : "—"}
                </div>
              </div>
              {item.amount ? (
                <div className="shrink-0 text-sm font-bold text-tace-navy">
                  ₦{Number(item.amount).toLocaleString()}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-tace-gray/70">
          No interventions logged yet.
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Intervention</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
                Type
              </label>
              <Select value={type} onValueChange={(v) => v && setType(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
                Amount (optional)
              </label>
              <Input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
                Date
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
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
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
