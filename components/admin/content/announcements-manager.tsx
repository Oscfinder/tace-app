"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementPublish,
} from "@/lib/admin/content-actions";
import type { AnnouncementRow } from "@/lib/admin/content";

export function AnnouncementsManager({
  announcements,
}: {
  announcements: AnnouncementRow[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<AnnouncementRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleTogglePublish(a: AnnouncementRow) {
    setTogglingId(a.id);
    const result = await toggleAnnouncementPublish({
      id: a.id,
      publish: !a.is_published,
    });
    setTogglingId(null);
    if ("error" in result) {
      toast.add({
        title: "Couldn't update",
        description: result.error,
        type: "error",
      });
      return;
    }
    toast.add({
      title: a.is_published ? "Unpublished" : "Published",
      type: "success",
    });
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteAnnouncement(id);
    setDeletingId(null);
    if ("error" in result) {
      toast.add({
        title: "Couldn't delete",
        description: result.error,
        type: "error",
      });
      return;
    }
    toast.add({ title: "Announcement deleted", type: "success" });
    router.refresh();
  }

  return (
    <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold text-tace-navy">
          Announcements
        </h2>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          New Announcement
        </Button>
      </div>

      {announcements.length > 0 ? (
        <div className="mt-4 flex flex-col">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="flex items-start justify-between gap-3 border-b border-[#F1F3F6] py-3 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-tace-navy">
                    {a.title}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      a.is_published
                        ? "bg-tace-green/15 text-tace-green"
                        : "bg-tace-lgray text-tace-gray"
                    }`}
                  >
                    {a.is_published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-tace-gray">{a.content}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={togglingId === a.id}
                  onClick={() => handleTogglePublish(a)}
                >
                  {a.is_published ? "Unpublish" : "Publish"}
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Edit"
                  onClick={() => setEditing(a)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Delete"
                  disabled={deletingId === a.id}
                  onClick={() => handleDelete(a.id)}
                  className="text-tace-red hover:bg-tace-red/10"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-tace-gray/70">No announcements yet.</p>
      )}

      <AnnouncementDialog
        open={creating}
        onOpenChange={setCreating}
        mode="create"
      />
      <AnnouncementDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        mode="edit"
        announcement={editing}
      />
    </div>
  );
}

function AnnouncementDialog({
  open,
  onOpenChange,
  mode,
  announcement,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  announcement?: AnnouncementRow | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(announcement?.title ?? "");
  const [content, setContent] = useState(announcement?.content ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const result =
      mode === "create"
        ? await createAnnouncement({ title, content })
        : await updateAnnouncement({ id: announcement!.id, title, content });
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
    setTitle("");
    setContent("");
    toast.add({
      title: mode === "create" ? "Announcement posted" : "Announcement updated",
      type: "success",
    });
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) {
          setTitle(announcement?.title ?? "");
          setContent(announcement?.content ?? "");
          setError(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Post an Announcement" : "Edit Announcement"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2.5">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="What's the announcement?"
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {error ? <p className="text-sm text-tace-red">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !content.trim()}
          >
            {submitting ? "Saving..." : mode === "create" ? "Post" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
