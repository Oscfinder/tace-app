import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/public/section-heading";
import { Button } from "@/components/ui/button";
import { STOCK_IMAGES } from "@/lib/public/stock-images";

export type FeaturedStory = {
  id: string;
  title: string;
  excerpt: string;
  photoUrl: string | null;
  published_at: string | null;
};

function StoryCard({
  story,
  main,
  fallbackImage,
}: {
  story: FeaturedStory;
  main?: boolean;
  fallbackImage: string;
}) {
  return (
    <Link
      href={`/stories/${story.id}`}
      className={`group relative block overflow-hidden rounded-[20px] ${main ? "md:col-span-1" : ""}`}
    >
      <div
        className={`relative w-full bg-gradient-to-br from-tace-navy to-tace-blue ${
          main ? "aspect-[16/12]" : "aspect-[16/10]"
        }`}
      >
        <Image
          src={story.photoUrl ?? fallbackImage}
          alt={story.title}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[rgba(13,17,23,0.85)] from-30% p-6">
        <span className="mb-2.5 inline-block w-fit rounded-full bg-tace-blue px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          Impact Story
        </span>
        <div
          className={`font-heading font-extrabold leading-snug text-white ${
            main ? "text-2xl" : "text-lg"
          }`}
        >
          {story.title}
        </div>
      </div>
    </Link>
  );
}

function PlaceholderStory({ main }: { main?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center rounded-[20px] bg-tace-lgray text-sm font-semibold text-tace-gray ${
        main ? "aspect-[16/12]" : "aspect-[16/10]"
      }`}
    >
      Stories coming soon
    </div>
  );
}

export function StoriesSection({ stories }: { stories: FeaturedStory[] }) {
  const [main, ...rest] = stories;

  return (
    <section className="bg-white px-4 py-20 md:px-8 md:py-[88px]">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <SectionHeading tag="Stories & Impact" title="Stories of Impact" />
          <Button render={<Link href="/stories" />} variant="outline" size="lg">
            View All Stories
          </Button>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-[2fr_1fr_1fr]">
          {main ? (
            <StoryCard
              story={main}
              main
              fallbackImage={STOCK_IMAGES.stories[0]}
            />
          ) : (
            <PlaceholderStory main />
          )}
          {rest.length > 0
            ? rest
                .slice(0, 2)
                .map((story, i) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    fallbackImage={STOCK_IMAGES.stories[i + 1]}
                  />
                ))
            : [0, 1].map((i) => <PlaceholderStory key={i} />)}
        </div>
      </div>
    </section>
  );
}
