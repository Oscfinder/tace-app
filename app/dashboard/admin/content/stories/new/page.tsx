import { getBeneficiaryOptions } from "@/lib/admin/content";
import { StoryEditorForm } from "@/components/admin/content/story-editor-form";

export default async function NewStoryPage() {
  const beneficiaries = await getBeneficiaryOptions();

  return (
    <div className="flex flex-col gap-6 pt-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-tace-navy">
          New Story
        </h1>
        <p className="mt-1 text-sm text-tace-gray">
          Saved as a draft — publish from the story page once it&apos;s ready.
        </p>
      </div>

      <StoryEditorForm mode="create" beneficiaries={beneficiaries} />
    </div>
  );
}
