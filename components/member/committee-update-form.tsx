"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { saveCommitteeUpdate } from "@/lib/member/actions";

export function CommitteeUpdateForm({
  monthLabel,
  initialContent,
}: {
  monthLabel: string;
  initialContent: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = initialContent.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveCommitteeUpdate({ content });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      toast.add({
        title: isEdit ? "Update edited" : "Update saved",
        type: "success",
      });
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      <label htmlFor="committee-update" className="text-sm font-medium text-tace-navy">
        Your update for {monthLabel}
      </label>
      <textarea
        id="committee-update"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        maxLength={4000}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "committee-update-error" : undefined}
        placeholder="What has your committee been working on this month?"
        className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {error ? (
        <p id="committee-update-error" role="alert" className="text-sm text-tace-red">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={pending || !content.trim()}
        className="h-11 w-full text-base sm:w-auto sm:self-start sm:px-6"
      >
        {pending ? "Saving..." : isEdit ? "Save changes" : "Submit update"}
      </Button>
    </form>
  );
}
