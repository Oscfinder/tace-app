"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import {
  MAX_RESOURCE_BYTES,
  RESOURCE_CATEGORIES,
  RESOURCE_TYPES,
} from "@/lib/admin/resource-constants";

type ActionResult = { error: string } | { success: true };

const BUCKET = "resources";

// Letters, digits, dot, dash, underscore only — no path tricks, no spaces.
function safeBaseName(original: string) {
  const withoutExt = original.replace(/\.[^./\\]+$/, "");
  const slug = withoutExt
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80);
  return slug || "file";
}

function refresh() {
  revalidatePath("/dashboard/admin/content/resources");
  revalidatePath("/dashboard/member/resources");
}

// Body size: next.config.ts raises the Server Action limit to 6MB, which
// covers a 5MB file plus multipart overhead. The checks below are the real
// enforcement (the browser check is only a convenience), and the bucket also
// enforces 5MB and PDF/JPG/PNG on its own (migration 007).
export async function uploadResource(formData: FormData): Promise<ActionResult> {
  await requireRole("admin");

  const category = String(formData.get("category") ?? "");
  if (!RESOURCE_CATEGORIES.some((c) => c.value === category)) {
    return { error: "Please choose a category." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a file to upload." };
  }
  if (file.size > MAX_RESOURCE_BYTES) {
    return { error: "That file is larger than 5MB." };
  }
  const ext = RESOURCE_TYPES[file.type as keyof typeof RESOURCE_TYPES];
  if (!ext) {
    return { error: "Only PDF, JPG or PNG files are allowed." };
  }

  const path = `${category}/${safeBaseName(file.name)}.${ext}`;
  const supabase = await createClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    if (/already exists|duplicate/i.test(error.message)) {
      return {
        error: "A file with that name already exists in this category. Rename it and try again.",
      };
    }
    return { error: error.message };
  }

  refresh();
  return { success: true };
}

export async function deleteResource(path: string): Promise<ActionResult> {
  await requireRole("admin");

  // Expect "category/filename.ext" (or a bare root filename for old uploads).
  const parts = path.split("/");
  const valid =
    parts.length >= 1 &&
    parts.length <= 2 &&
    parts.every((p) => p !== "" && p !== "." && p !== ".." && !p.includes("\\"));
  if (!valid) return { error: "Invalid file." };

  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) return { error: error.message };

  refresh();
  return { success: true };
}
