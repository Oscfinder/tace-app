"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { StoryPhotoPicker } from "@/components/admin/content/story-photo-picker";
import { createStory, updateStory } from "@/lib/admin/content-actions";
import type { BeneficiaryOption } from "@/lib/admin/content";

const NONE_VALUE = "__none__";

export function StoryEditorForm({
  mode,
  storyId,
  initialValues,
  beneficiaries,
}: {
  mode: "create" | "edit";
  storyId?: string;
  initialValues?: {
    title: string;
    content: string;
    excerpt: string | null;
    beneficiaryId: string | null;
    photoUrl: string | null;
  };
  beneficiaries: BeneficiaryOption[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [content, setContent] = useState(initialValues?.content ?? "");
  const [excerpt, setExcerpt] = useState(initialValues?.excerpt ?? "");
  const [beneficiaryId, setBeneficiaryId] = useState(
    initialValues?.beneficiaryId ?? NONE_VALUE,
  );
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("content", content);
    formData.set("excerpt", excerpt);
    formData.set(
      "beneficiaryId",
      beneficiaryId === NONE_VALUE ? "" : beneficiaryId,
    );
    if (file) formData.set("file", file);

    if (mode === "create") {
      const result = await createStory(formData);
      // createStory redirects on success and never returns in that case.
      if (result && "error" in result) {
        setSubmitting(false);
        setError(result.error);
      }
      return;
    }

    const result = await updateStory(storyId!, formData);
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({ title: "Story saved", type: "success" });
    router.refresh();
  }

  return (
    <div className="max-w-xl rounded-[14px] border border-[#ECEFF3] bg-white p-6">
      <div className="flex flex-col gap-3.5">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
            Title
          </label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
            Excerpt (optional)
          </label>
          <Input
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Shown in the stories list — falls back to the start of the content"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
            Linked Beneficiary (optional)
          </label>
          <Select
            value={beneficiaryId}
            onValueChange={(v) => setBeneficiaryId(v ?? NONE_VALUE)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="No linked child" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>No linked child</SelectItem>
              {beneficiaries.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.first_name} {b.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-tace-gray/70">
            Publishing a linked story checks that child&apos;s photography
            consent first.
          </p>
        </div>

        <StoryPhotoPicker
          existingPhotoUrl={initialValues?.photoUrl}
          onFileSelected={setFile}
        />

        {error ? <p className="text-sm text-tace-red">{error}</p> : null}

        <Button
          onClick={handleSubmit}
          disabled={submitting || !title.trim() || !content.trim()}
          className="mt-1 self-start"
        >
          {submitting
            ? "Saving..."
            : mode === "create"
              ? "Create Story"
              : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
