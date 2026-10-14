"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, Image as ImageIcon, Trash2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { deleteResource, uploadResource } from "@/lib/admin/resources-actions";
import {
  MAX_RESOURCE_BYTES,
  RESOURCE_ACCEPT,
  RESOURCE_CATEGORIES,
  RESOURCE_TYPES,
} from "@/lib/admin/resource-constants";
import type { ResourceFile, ResourceGroup } from "@/lib/admin/resources";

const fieldClass =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const card =
  "rounded-[13px] border border-[#e5edf6] bg-white p-5 shadow-[0_8px_28px_rgba(20,55,95,0.07)]";

function formatSize(bytes: number | null) {
  if (bytes === null) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResourcesManager({ groups }: { groups: ResourceGroup[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<string>(RESOURCE_CATEGORIES[0].value);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<ResourceFile | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Client check is a convenience only; the server action and the bucket
  // enforce the same limits.
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0] ?? null;
    setFile(null);
    setFileError(null);
    if (!chosen) return;
    if (!(chosen.type in RESOURCE_TYPES)) {
      setFileError("Only PDF, JPG or PNG files are allowed.");
      e.target.value = "";
      return;
    }
    if (chosen.size > MAX_RESOURCE_BYTES) {
      setFileError("That file is larger than 5MB.");
      e.target.value = "";
      return;
    }
    setFile(chosen);
  }

  async function handleUpload() {
    if (!file) {
      setFileError("Please choose a file first.");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.set("category", category);
    formData.set("file", file);
    const result = await uploadResource(formData);
    setUploading(false);
    if ("error" in result) {
      setFileError(result.error);
      return;
    }
    toast.add({ title: "File uploaded", type: "success" });
    setFile(null);
    setFileError(null);
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    const result = await deleteResource(deleting.path);
    setDeleteBusy(false);
    if ("error" in result) {
      toast.add({ title: "Couldn't delete", description: result.error, type: "error" });
      return;
    }
    toast.add({ title: "File deleted", type: "success" });
    setDeleting(null);
    router.refresh();
  }

  const total = groups.reduce((n, g) => n + g.files.length, 0);

  return (
    <div className="flex flex-col gap-5">
      <section className={card}>
        <h2 className="font-heading text-base font-semibold text-tace-navy">Upload a file</h2>
        <p className="mt-0.5 text-xs text-tace-gray/70">
          PDF, JPG or PNG, up to 5MB. Active members can open these from their Resources page.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[200px_1fr_auto] sm:items-end">
          <label className="flex flex-col gap-1 text-sm font-medium text-tace-navy">
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClass}>
              {RESOURCE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-tace-navy">
            File
            <input
              ref={fileRef}
              type="file"
              accept={RESOURCE_ACCEPT}
              onChange={handleFile}
              aria-invalid={fileError ? true : undefined}
              aria-describedby={fileError ? "resource-file-error" : undefined}
              className="text-sm file:mr-3 file:rounded-lg file:border file:border-border file:bg-white file:px-3 file:py-2 file:text-sm"
            />
          </label>
          <Button onClick={handleUpload} disabled={uploading || !file} className="h-10">
            <Upload className="size-4" />
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
        {fileError ? (
          <p id="resource-file-error" role="alert" className="mt-2 text-sm text-tace-red">
            {fileError}
          </p>
        ) : null}
      </section>

      <section className={card}>
        <h2 className="font-heading text-base font-semibold text-tace-navy">
          Files ({total})
        </h2>
        {total === 0 ? (
          <p className="mt-3 text-sm text-tace-gray/70">
            No files yet. Upload one above and it will appear here and on the member Resources page.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-5">
            {groups
              .filter((g) => g.files.length > 0)
              .map((g) => (
                <div key={g.value || "general"}>
                  <h3 className="text-xs font-bold tracking-wide text-tace-gray uppercase">
                    {g.label}
                  </h3>
                  <div className="mt-1">
                    {g.files.map((f) => {
                      const isImage = /\.(jpe?g|png)$/i.test(f.name);
                      const Icon = isImage ? ImageIcon : FileText;
                      return (
                        <div
                          key={f.path}
                          className="flex items-center gap-3 border-b border-[#F1F3F6] py-2.5 last:border-b-0"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F6FD] text-tace-blue">
                            <Icon className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-tace-navy">{f.name}</p>
                            <p className="text-xs text-tace-gray/70">
                              {[formatSize(f.size), f.createdAt ? new Date(f.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                          {f.url ? (
                            <a
                              href={f.url}
                              aria-label={`Download ${f.name}`}
                              className="inline-flex size-10 items-center justify-center rounded-lg text-tace-blue hover:bg-[#E8F6FD]"
                            >
                              <Download className="size-4" />
                            </a>
                          ) : null}
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Delete ${f.name}`}
                            onClick={() => setDeleting(f)}
                            className="size-10 text-tace-red hover:bg-tace-red/10"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && !deleteBusy && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this file?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleting?.name}&rdquo; will be removed from storage and from every member&apos;s Resources page. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={deleteBusy} onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button disabled={deleteBusy} onClick={confirmDelete} className="bg-tace-red text-white hover:bg-tace-red/90">
              {deleteBusy ? "Deleting..." : "Yes, delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
