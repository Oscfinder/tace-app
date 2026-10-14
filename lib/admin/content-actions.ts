"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { getStoryConsentWarning } from "@/lib/admin/content";

type ActionResult = { error: string } | { success: true };

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

function readStoryFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const beneficiaryId = String(formData.get("beneficiaryId") ?? "") || null;
  const file = formData.get("file");
  return {
    title,
    content,
    excerpt: excerpt || null,
    beneficiaryId,
    file: file instanceof File && file.size > 0 ? file : null,
  };
}

function validateFile(file: File | null): string | null {
  if (!file) return null;
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only JPG or PNG photos are allowed.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "Photo is larger than the 5MB limit.";
  }
  return null;
}

export async function createStory(
  formData: FormData,
): Promise<ActionResult | never> {
  const session = await requireRole("admin");
  const { title, content, excerpt, beneficiaryId, file } =
    readStoryFields(formData);
  if (!title) return { error: "Title is required." };
  if (!content) return { error: "Content is required." };
  const fileError = validateFile(file);
  if (fileError) return { error: fileError };

  const supabase = await createClient();

  const { data: story, error: insertError } = await supabase
    .from("stories")
    .insert({
      title,
      content,
      excerpt,
      beneficiary_id: beneficiaryId,
      created_by: session.user.id,
    })
    .select("id")
    .single();
  if (insertError || !story) {
    return { error: insertError?.message ?? "Could not create story." };
  }

  if (file) {
    // public-assets only — never the private beneficiary-photos bucket.
    const path = `stories/${story.id}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("public-assets")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) return { error: uploadError.message };

    await supabase
      .from("stories")
      .update({ photo_url: path })
      .eq("id", story.id);
  }

  revalidatePath("/dashboard/admin/content/stories");
  redirect(`/dashboard/admin/content/stories/${story.id}`);
}

export async function updateStory(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("admin");
  const { title, content, excerpt, beneficiaryId, file } =
    readStoryFields(formData);
  if (!title) return { error: "Title is required." };
  if (!content) return { error: "Content is required." };
  const fileError = validateFile(file);
  if (fileError) return { error: fileError };

  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from("stories")
    .update({
      title,
      content,
      excerpt,
      beneficiary_id: beneficiaryId,
    })
    .eq("id", id);
  if (updateError) return { error: updateError.message };

  if (file) {
    const path = `stories/${id}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("public-assets")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) return { error: uploadError.message };

    await supabase.from("stories").update({ photo_url: path }).eq("id", id);
  }

  revalidatePath("/dashboard/admin/content/stories");
  revalidatePath(`/dashboard/admin/content/stories/${id}`);
  return { success: true };
}

export async function deleteStory(id: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  // Best-effort storage cleanup — a failure here shouldn't block deleting
  // the row itself (per the ticket, this is a soft requirement).
  try {
    const { data: files } = await supabase.storage
      .from("public-assets")
      .list(`stories/${id}`);
    if (files && files.length > 0) {
      await supabase.storage
        .from("public-assets")
        .remove(files.map((f) => `stories/${id}/${f.name}`));
    }
  } catch (err) {
    console.error("Story photo cleanup failed:", err);
  }

  const { error } = await supabase.from("stories").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/content/stories");
  return { success: true };
}

export async function toggleStoryPublish(input: {
  id: string;
  publish: boolean;
  confirmedDespiteWarning?: boolean;
}): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  if (input.publish) {
    const { data: story } = await supabase
      .from("stories")
      .select("beneficiary_id")
      .eq("id", input.id)
      .maybeSingle();

    const warning = await getStoryConsentWarning(story?.beneficiary_id ?? null);
    if (warning && !input.confirmedDespiteWarning) {
      return { error: `${warning} Confirm to publish anyway.` };
    }
  }

  const { error } = await supabase
    .from("stories")
    .update(
      input.publish
        ? { is_published: true, published_at: new Date().toISOString() }
        : { is_published: false },
    )
    .eq("id", input.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/content/stories");
  revalidatePath(`/dashboard/admin/content/stories/${input.id}`);
  revalidatePath("/");
  revalidatePath("/stories");
  return { success: true };
}

export async function createAnnouncement(input: {
  title: string;
  content: string;
}): Promise<ActionResult> {
  const session = await requireRole("admin");
  if (!input.title.trim() || !input.content.trim()) {
    return { error: "Title and content are both required." };
  }
  const supabase = await createClient();

  const { error } = await supabase.from("announcements").insert({
    title: input.title,
    content: input.content,
    created_by: session.user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/content/announcements");
  return { success: true };
}

export async function updateAnnouncement(input: {
  id: string;
  title: string;
  content: string;
}): Promise<ActionResult> {
  await requireRole("admin");
  if (!input.title.trim() || !input.content.trim()) {
    return { error: "Title and content are both required." };
  }
  const supabase = await createClient();

  const { error } = await supabase
    .from("announcements")
    .update({ title: input.title, content: input.content })
    .eq("id", input.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/content/announcements");
  return { success: true };
}

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/content/announcements");
  return { success: true };
}

export async function toggleAnnouncementPublish(input: {
  id: string;
  publish: boolean;
}): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("announcements")
    .update(
      input.publish
        ? { is_published: true, published_at: new Date().toISOString() }
        : { is_published: false },
    )
    .eq("id", input.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/content/announcements");
  return { success: true };
}
