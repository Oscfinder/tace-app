import { getResourceGroups } from "@/lib/admin/resources";
import { ResourcesManager } from "@/components/admin/content/resources-manager";

export default async function AdminResourcesPage() {
  const groups = await getResourceGroups();

  return (
    <div className="flex flex-col gap-6 pt-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-tace-navy">Resources</h1>
        <p className="mt-1 text-sm text-tace-gray">
          Foundation documents for members: policies, minutes, templates and guides.
        </p>
      </div>
      <ResourcesManager groups={groups} />
    </div>
  );
}
