import Link from "next/link";
import { Plus } from "lucide-react";
import { getStories } from "@/lib/admin/content";
import { StoriesTable } from "@/components/admin/content/stories-table";
import { Button } from "@/components/ui/button";

export default async function StoriesPage() {
  const stories = await getStories();

  return (
    <div className="flex flex-col gap-6 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-tace-navy">
            Stories
          </h1>
          <p className="mt-1 text-sm text-tace-gray">
            Impact stories shown on the public site.
          </p>
        </div>
        <Button render={<Link href="/dashboard/admin/content/stories/new" />}>
          <Plus className="size-4" />
          New Story
        </Button>
      </div>

      <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-5">
        <StoriesTable stories={stories} />
      </div>
    </div>
  );
}
