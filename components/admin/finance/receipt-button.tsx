"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { sendDonationReceipt } from "@/lib/admin/sponsors-actions";

export function ReceiptButton({
  donationId,
  hasEmail,
}: {
  donationId: string;
  hasEmail: boolean;
}) {
  const router = useRouter();
  const [sending, setSending] = useState(false);

  async function send() {
    setSending(true);
    const result = await sendDonationReceipt(donationId);
    setSending(false);
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

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={sending || !hasEmail}
      title={hasEmail ? undefined : "No email on file for this donor"}
      onClick={send}
      className="min-h-9"
    >
      {sending ? "Sending..." : "Send receipt"}
    </Button>
  );
}
