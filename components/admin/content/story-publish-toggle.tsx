"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { toggleStoryPublish } from "@/lib/admin/content-actions";

export function StoryPublishToggle({
  storyId,
  isPublished,
}: {
  storyId: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [warning, setWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doPublish(confirmedDespiteWarning: boolean) {
    setSubmitting(true);
    setError(null);
    const result = await toggleStoryPublish({
      id: storyId,
      publish: true,
      confirmedDespiteWarning,
    });
    setSubmitting(false);
    if ("error" in result) {
      if (!confirmedDespiteWarning) {
        setWarning(result.error);
        return;
      }
      setError(result.error);
      return;
    }
    setWarning(null);
    toast.add({ title: "Story published", type: "success" });
    router.refresh();
  }

  async function handleUnpublish() {
    setSubmitting(true);
    setError(null);
    const result = await toggleStoryPublish({ id: storyId, publish: false });
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({ title: "Story unpublished", type: "success" });
    router.refresh();
  }

  if (isPublished) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          onClick={handleUnpublish}
          disabled={submitting}
          className="border-tace-red/30 text-tace-red hover:bg-tace-red/10"
        >
          {submitting ? "Unpublishing..." : "Unpublish"}
        </Button>
        {error ? <p className="text-sm text-tace-red">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {warning ? (
        <div className="rounded-lg border border-tace-yellow/40 bg-tace-yellow/10 p-3">
          <p className="text-sm text-tace-navy">{warning}</p>
          <div className="mt-2.5 flex gap-2.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setWarning(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => doPublish(true)}
              disabled={submitting}
            >
              {submitting ? "Publishing..." : "Publish Anyway"}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => doPublish(false)}
          disabled={submitting}
          className="bg-tace-green text-white hover:bg-tace-green/90"
        >
          {submitting ? "Publishing..." : "Publish"}
        </Button>
      )}
      {error ? <p className="text-sm text-tace-red">{error}</p> : null}
    </div>
  );
}
