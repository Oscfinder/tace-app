"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { sendThankYou } from "@/lib/beneficiary/actions";

export function ThankYouForm({ sponsorName }: { sponsorName: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await sendThankYou({ content });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setContent("");
      toast.add({
        title: "Message saved 💙",
        description: "We'll check it and pass it on to your sponsor.",
        type: "success",
      });
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      <label htmlFor="thank-you" className="text-base font-bold text-m-ink">
        Write a thank-you to {sponsorName}
      </label>
      <textarea
        id="thank-you"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        maxLength={1000}
        placeholder="Dear sponsor, thank you for…"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "thank-you-error" : undefined}
        className="w-full rounded-xl border border-m-line bg-[#fbfcfe] px-4 py-3 text-[17px] leading-relaxed outline-none focus-visible:border-[#89d3f5] focus-visible:ring-4 focus-visible:ring-[#0ba6e820]"
      />
      {error ? (
        <p id="thank-you-error" role="alert" className="text-base font-medium text-[#d63e69]">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || content.trim().length < 3}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-m-blue to-m-blue2 text-base font-bold text-white shadow-[0_8px_18px_#009de832] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send className="size-5" />
        {pending ? "Sending…" : "Send my thank-you"}
      </button>
    </form>
  );
}
