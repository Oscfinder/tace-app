import { FileText } from "lucide-react";
import { getResources } from "@/lib/member/queries";
import { Card, EmptyState, PageHeader } from "@/components/member/ui";

export default async function ResourcesPage() {
  const groups = await getResources();

  return (
    <div className="flex flex-col gap-6 pt-5">
      <PageHeader
        title="Resources"
        subtitle="Foundation documents for members. Links expire after an hour."
      />
      {groups.length > 0 ? (
        groups.map((g) => (
          <section key={g.category} className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-semibold capitalize text-tace-navy">
              {g.category.replace(/[-_]/g, " ")}
            </h2>
            <Card className="!p-0">
              <ul>
                {g.files.map((f) => (
                  <li
                    key={f.name}
                    className="border-b border-[#F1F3F6] last:border-b-0"
                  >
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-11 items-center gap-3 px-5 py-3 text-sm font-medium text-tace-navy hover:bg-tace-lgray"
                    >
                      <FileText className="size-4 shrink-0 text-tace-blue" />
                      <span className="min-w-0 break-words">{f.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))
      ) : (
        <EmptyState
          title="No documents yet"
          message="Policies, templates and other foundation documents will be available here once an admin uploads them."
        />
      )}
    </div>
  );
}
