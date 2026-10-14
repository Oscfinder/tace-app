import { notFound } from "next/navigation";
import { getStory, getBeneficiaryOptions } from "@/lib/admin/content";
import { StoryEditorForm } from "@/components/admin/content/story-editor-form";
import { StoryPublishToggle } from "@/components/admin/content/story-publish-toggle";
import { DeleteStoryButton } from "@/components/admin/content/delete-story-button";

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [story, beneficiaries] = await Promise.all([
    getStory(id),
    getBeneficiaryOptions(),
  ]);
  if (!story) notFound();

  return (
    <div className="flex flex-col gap-5 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-tace-navy">
            {story.title}
          </h1>
          <p className="mt-1 text-xs text-tace-gray/70">
            {story.is_published ? "Published" : "Draft"}
            {story.published_at
              ? ` · ${new Date(story.published_at).toLocaleDateString("en-GB")}`
              : ""}
          </p>
        </div>
        <div className="flex items-start gap-2.5">
          <StoryPublishToggle
            storyId={story.id}
            isPublished={story.is_published}
          />
          <DeleteStoryButton storyId={story.id} />
        </div>
      </div>

      <StoryEditorForm
        mode="edit"
        storyId={story.id}
        beneficiaries={beneficiaries}
        initialValues={{
          title: story.title,
          content: story.content,
          excerpt: story.excerpt,
          beneficiaryId: story.beneficiary_id,
          photoUrl: story.photoUrl,
        }}
      />
    </div>
  );
}
