"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { publishProject, unpublishProject } from "@/lib/admin/projects-actions";

export function PublishToggle({
  projectId,
  isPublished,
  status,
  consentWarnings,
}: {
  projectId: string;
  isPublished: boolean;
  status: string;
  consentWarnings: string[];
}) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doPublish(confirmedDespiteWarnings: boolean) {
    setSubmitting(true);
    setError(null);
    const result = await publishProject({
      projectId,
      confirmedDespiteWarnings,
    });
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setShowWarning(false);
    toast.add({ title: "Project published", type: "success" });
    router.refresh();
  }

  async function handlePublishClick() {
    if (consentWarnings.length > 0 && !showWarning) {
      setShowWarning(true);
      return;
    }
    doPublish(consentWarnings.length > 0);
  }

  async function handleUnpublish() {
    setSubmitting(true);
    setError(null);
    const result = await unpublishProject(projectId);
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({ title: "Project unpublished", type: "success" });
    router.refresh();
  }

  if (status === "archived") {
    return (
      <p className="text-sm text-tace-gray/70">
        Archived projects can&apos;t be published.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {isPublished ? (
        <Button
          variant="outline"
          onClick={handleUnpublish}
          disabled={submitting}
          className="border-tace-red/30 text-tace-red hover:bg-tace-red/10"
        >
          {submitting ? "Unpublishing..." : "Unpublish"}
        </Button>
      ) : (
        <>
          {showWarning ? (
            <div className="rounded-lg border border-tace-yellow/40 bg-tace-yellow/10 p-3">
              <p className="text-sm text-tace-navy">
                <strong>{consentWarnings.join(", ")}</strong>{" "}
                {consentWarnings.length === 1 ? "doesn't" : "don't"} have
                photography consent and won&apos;t appear publicly even once
                this project is published. Publish anyway?
              </p>
              <div className="mt-2.5 flex gap-2.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowWarning(false)}
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
              onClick={handlePublishClick}
              disabled={submitting}
              className="bg-tace-green text-white hover:bg-tace-green/90"
            >
              {submitting ? "Publishing..." : "Publish"}
            </Button>
          )}
        </>
      )}
      {error ? <p className="text-sm text-tace-red">{error}</p> : null}
    </div>
  );
}
