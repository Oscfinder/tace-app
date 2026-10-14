import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "beneficiary-photos";

/**
 * Applications upload to applications/{application_id}/photo.ext (the only
 * place anonymous visitors may write). Once approved, the photo belongs to the
 * beneficiary and must follow the {beneficiary_id}/photo.ext convention that
 * the storage policies for sponsors and mentors rely on.
 *
 * Copies the file, then removes the original. Returns the new path, or null
 * if there was nothing to move / the move failed (the caller keeps the old
 * path in that case so the photo is never lost).
 */
export async function movePhotoToBeneficiary(
  applicationPath: string | null,
  beneficiaryId: string,
): Promise<string | null> {
  if (!applicationPath || !applicationPath.startsWith("applications/")) {
    return null;
  }
  const ext = applicationPath.split(".").pop() ?? "jpg";
  const destination = `${beneficiaryId}/photo.${ext}`;

  const admin = createAdminClient();
  const { error: copyError } = await admin.storage
    .from(BUCKET)
    .copy(applicationPath, destination);
  if (copyError) {
    console.error("Photo copy failed:", copyError.message);
    return null;
  }

  const { error: removeError } = await admin.storage
    .from(BUCKET)
    .remove([applicationPath]);
  if (removeError) {
    // The copy succeeded; a leftover original is harmless, so don't fail.
    console.error("Original photo cleanup failed:", removeError.message);
  }
  return destination;
}
