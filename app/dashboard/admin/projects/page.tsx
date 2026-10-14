import Link from "next/link";
import { Plus } from "lucide-react";
import { getProjects } from "@/lib/admin/projects";
import { ProjectsTable } from "@/components/admin/projects/projects-table";
import { Button } from "@/components/ui/button";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="flex flex-col gap-6 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-tace-navy">
            Projects
          </h1>
          <p className="mt-1 text-sm text-tace-gray">
            Fundraising campaigns and the children attached to them.
          </p>
        </div>
        <Button render={<Link href="/dashboard/admin/projects/new" />}>
          <Plus className="size-4" />
          New Project
        </Button>
      </div>

      <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-5">
        <ProjectsTable projects={projects} />
      </div>
    </div>
  );
}
