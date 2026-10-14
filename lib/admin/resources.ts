import { createClient } from "@/lib/supabase/server";
import { RESOURCE_CATEGORIES } from "@/lib/admin/resource-constants";

export type ResourceFile = {
  /** Full storage path, e.g. "policies/code-of-conduct.pdf". */
  path: string;
  name: string;
  size: number | null;
  createdAt: string | null;
  /** 1-hour signed download link. */
  url: string | null;
};
export type ResourceGroup = { value: string; label: string; files: ResourceFile[] };

const BUCKET = "resources";

export async function getResourceGroups(): Promise<ResourceGroup[]> {
  const supabase = await createClient();

  async function listFolder(folder: string): Promise<ResourceFile[]> {
    const { data } = await supabase.storage.from(BUCKET).list(folder, {
      limit: 200,
      sortBy: { column: "created_at", order: "desc" },
    });
    const real = (data ?? []).filter(
      (f) => f.id !== null && f.name !== ".emptyFolderPlaceholder",
    );
    return Promise.all(
      real.map(async (f) => {
        const path = folder ? `${folder}/${f.name}` : f.name;
        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(path, 3600, { download: f.name });
        return {
          path,
          name: f.name,
          size: typeof f.metadata?.size === "number" ? f.metadata.size : null,
          createdAt: f.created_at ?? null,
          url: signed?.signedUrl ?? null,
        };
      }),
    );
  }

  const groups: ResourceGroup[] = await Promise.all(
    RESOURCE_CATEGORIES.map(async (c) => ({
      value: c.value,
      label: c.label,
      files: await listFolder(c.value),
    })),
  );

  // Anything uploaded outside the five categories (older files) still shows.
  const { data: top } = await supabase.storage.from(BUCKET).list("", { limit: 200 });
  const known = new Set<string>(RESOURCE_CATEGORIES.map((c) => c.value));
  const extraFolders = (top ?? [])
    .filter((e) => e.id === null && !known.has(e.name))
    .map((e) => e.name);
  for (const folder of extraFolders) {
    groups.push({ value: folder, label: folder, files: await listFolder(folder) });
  }
  const rootFiles = await listFolder("");
  if (rootFiles.length > 0) {
    groups.push({ value: "", label: "General", files: rootFiles });
  }
  return groups;
}
