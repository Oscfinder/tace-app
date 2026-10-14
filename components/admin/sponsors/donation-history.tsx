"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { sendDonationReceipt } from "@/lib/admin/sponsors-actions";
import type { DonationRow } from "@/lib/admin/sponsors";

export function DonationHistory({ donations }: { donations: DonationRow[] }) {
  const router = useRouter();
  const [sendingId, setSendingId] = useState<string | null>(null);

  async function handleSendReceipt(id: string) {
    setSendingId(id);
    const result = await sendDonationReceipt(id);
    setSendingId(null);
    if ("error" in result) {
      toast.add({
        title: "Couldn't send receipt",
        description: result.error,
        type: "error",
      });
      return;
    }
    toast.add({ title: "Receipt sent", type: "success" });
    router.refresh();
  }

  if (donations.length === 0) {
    return <p className="text-sm text-tace-gray/70">No donations yet.</p>;
  }

  return (
    <div className="flex flex-col">
      {donations.map((d) => (
        <div
          key={d.id}
          className="flex items-center justify-between gap-3 border-b border-[#F1F3F6] py-3 last:border-b-0"
        >
          <div>
            <div className="text-sm font-semibold text-tace-navy">
              {d.donor_name}
            </div>
            <div className="text-xs text-tace-gray/70">
              {new Date(d.created_at).toLocaleDateString("en-GB")}
              {d.purpose ? ` · ${d.purpose}` : ""}
              {d.bank_ref ? ` · Ref: ${d.bank_ref}` : ""}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="text-sm font-bold text-tace-navy">
              ₦{Number(d.amount).toLocaleString()}
            </div>
            {d.receipt_sent ? (
              <span className="text-xs font-semibold text-tace-green">
                Receipted
              </span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={sendingId === d.id}
                onClick={() => handleSendReceipt(d.id)}
              >
                {sendingId === d.id ? "Sending..." : "Send Receipt"}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
