import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "beneficiary-photos";
const PREFIX = "applications";
export const ORPHAN_AGE_DAYS = 7;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE = 100;
const MAX_PAGES = 50;

export type CleanupResult = { scanned: number; deleted: number };

/**
 * Applicants upload a photo to applications/{id}/photo.ext before the
 * application row exists. If they never finish, the file is left behind. This
 * removes files older than 7 days whose application id has no row.
 *
 * A file whose application row exists is never touched (pending, flagged and
 * rejected applications keep their photo), and neither is anything newer than
 * the cutoff. Service-role: only call from an admin Server Action or the cron
 * route, never from a public route.
 */
export async function cleanupOrphanedApplicationPhotos(): Promise<CleanupResult> {
  const admin = createAdminClient();
  const cutoff = Date.now() - ORPHAN_AGE_DAYS * 24 * 60 * 60 * 1000;

  // Folders directly under applications/ (one per application id).
  const folders: string[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await admin.storage
      .from(BUCKET)
      .list(PREFIX, { limit: PAGE, offset: page * PAGE });
    if (error) throw new Error(`Could not list ${PREFIX}/: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const entry of data) {
      if (UUID.test(entry.name)) folders.push(entry.name);
    }
    if (data.length < PAGE) break;
  }

  // Only old folders are candidates.
  const candidates: { id: string; paths: string[] }[] = [];
  let scanned = 0;
  for (const id of folders) {
    const { data: files } = await admin.storage.from(BUCKET).list(`${PREFIX}/${id}`, { limit: PAGE });
    if (!files || files.length === 0) continue;
    scanned += files.length;
    const newest = Math.max(
      ...files.map((f) => new Date(f.created_at ?? f.updated_at ?? Date.now()).getTime()),
    );
    if (newest < cutoff) {
      candidates.push({ id, paths: files.map((f) => `${PREFIX}/${id}/${f.name}`) });
    }
  }
  if (candidates.length === 0) return { scanned, deleted: 0 };

  // Which of these ids have an application row?
  const owned = new Set<string>();
  for (let i = 0; i < candidates.length; i += 100) {
    const ids = candidates.slice(i, i + 100).map((c) => c.id);
    const { data, error } = await admin.from("applications").select("id").in("id", ids);
    if (error) throw new Error(`Could not check applications: ${error.message}`);
    for (const row of data ?? []) owned.add(row.id);
  }

  const toDelete = candidates.filter((c) => !owned.has(c.id)).flatMap((c) => c.paths);
  if (toDelete.length === 0) return { scanned, deleted: 0 };
  const { error } = await admin.storage.from(BUCKET).remove(toDelete);
  if (error) throw new Error(`Could not delete files: ${error.message}`);
  return { scanned, deleted: toDelete.length };
}
