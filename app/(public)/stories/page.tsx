import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageBody, PageHeader } from "@/components/public/page-shell";
import { createAnonClient } from "@/lib/supabase/anon";
import { STOCK_IMAGES } from "@/lib/public/stock-images";

export const metadata: Metadata = {
  title: "Stories of impact | TACE Welfare Foundation",
  description: "Read how support from TACE Welfare Foundation changes children's lives.",
  alternates: { canonical: "/stories" },
};

// Rendered on each request and read as a visitor (row-level security allows only
// published stories), so a story published or removed in Admin shows or goes at once.
export const dynamic = "force-dynamic";

export default async function StoriesPage() {
  const anon = createAnonClient();
  const { data } = await anon
    .from("stories")
    .select("id, title, content, excerpt, photo_url, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(60);
  const stories = data ?? [];

  return (
    <>
      <PageHeader
        tag="Stories & impact"
        title="Stories of impact"
        subtitle="Real children, real progress. Stories appear here only with the guardian's consent."
      />
      <PageBody wide>
        {stories.length === 0 ? (
          <p className="rounded-2xl bg-tace-lgray p-8 text-center font-semibold text-tace-gray">
            Our first stories are coming soon. Please check back.
          </p>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((s, i) => {
              const photo = s.photo_url
                ? anon.storage.from("public-assets").getPublicUrl(s.photo_url).data.publicUrl
                : STOCK_IMAGES.stories[i % STOCK_IMAGES.stories.length];
              const excerpt = s.excerpt ?? `${s.content.slice(0, 140)}…`;
              return (
                <li key={s.id}>
                  <Link
                    href={`/stories/${s.id}`}
                    className="group block overflow-hidden rounded-[20px] border border-border bg-white transition-shadow hover:shadow-xl"
                  >
                    <div className="relative aspect-[16/10] bg-tace-navy">
                      <Image
                        src={photo}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5">
                      {s.published_at ? (
                        <time dateTime={s.published_at} className="text-xs font-semibold uppercase tracking-wide text-tace-gray">
                          {new Date(s.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                        </time>
                      ) : null}
                      <h2 className="mt-1.5 font-heading text-lg font-extrabold text-tace-navy">{s.title}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-tace-gray">{excerpt}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </PageBody>
    </>
  );
}
