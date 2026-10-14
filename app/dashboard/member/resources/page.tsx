import { FileText, FolderOpen } from "lucide-react";
import { getResources } from "@/lib/member/queries";
import {
  EmptyState,
  IconTile,
  PageHeader,
  Panel,
  type Accent,
} from "@/components/member/ui";

const CYCLE: Accent[] = ["blue", "teal", "purple", "amber", "pink"];

export default async function ResourcesPage() {
  const groups = await getResources();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Resources"
        title="Foundation documents"
        subtitle="Policies, templates and guides for members. Links expire after an hour."
      />
      {groups.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {groups.map((g, gi) => (
            <Panel
              key={g.category}
              title={g.category
                .replace(/[-_]/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())}
              subtitle={`${g.files.length} ${g.files.length === 1 ? "file" : "files"}`}
            >
              <ul>
                {g.files.map((f) => (
                  <li
                    key={f.name}
                    className="border-t border-[#eff3f7] first:border-t-0"
                  >
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-11 items-center gap-3 py-3 text-[13px] font-semibold hover:text-[#008fda]"
                    >
                      <IconTile
                        icon={FileText}
                        accent={CYCLE[gi % CYCLE.length]}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1 break-words">{f.name}</span>
                      <span className="text-xs font-bold text-[#008fda]">
                        Open ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderOpen}
          accent="purple"
          title="No documents yet"
          message="Policies, templates and other foundation documents will be available here once an admin uploads them."
        />
      )}
    </div>
  );
}
