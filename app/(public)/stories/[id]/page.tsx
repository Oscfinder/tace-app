import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageBody, PageHeader } from "@/components/public/page-shell";
import { createAnonClient } from "@/lib/supabase/anon";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadStory(id: string) {
  if (!UUID.test(id)) return null;
  const anon = createAnonClient();
  const { data } = await anon
    .from("stories")
    .select("id, title, content, excerpt, photo_url, published_at")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();
  if (!data) return null;
  const photoUrl = data.photo_url
    ? anon.storage.from("public-assets").getPublicUrl(data.photo_url).data.publicUrl
    : null;
  return { ...data, photoUrl };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const story = await loadStory(id);
  if (!story) return { title: "Story not found | TACE Welfare Foundation" };
  return {
    title: `${story.title} | TACE Welfare Foundation`,
    description: story.excerpt ?? story.content.slice(0, 150),
    alternates: { canonical: `/stories/${story.id}` },
  };
}

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = await loadStory(id);
  if (!story) notFound();

  // Paragraphs are separated by blank lines. React escapes the text, so a story
  // can never inject markup.
  const paragraphs = story.content.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <>
      <PageHeader
        tag="Impact story"
        title={story.title}
        subtitle={
          story.published_at
            ? new Date(story.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
            : undefined
        }
      />
      <PageBody>
        {story.photoUrl ? (
          <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-[20px] bg-tace-lgray">
            <Image src={story.photoUrl} alt="" fill sizes="(min-width: 896px) 832px, 100vw" className="object-cover" priority />
          </div>
        ) : null}
        <article className="space-y-4 text-lg leading-relaxed text-tace-gray">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </article>
        <p className="mt-10">
          <Link href="/stories" className="font-semibold text-tace-blue underline">
            ← All stories
          </Link>
        </p>
      </PageBody>
    </>
  );
}
