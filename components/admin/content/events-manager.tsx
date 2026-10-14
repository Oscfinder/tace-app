"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { createEvent, deleteEvent, updateEvent } from "@/lib/admin/events-actions";
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  type EventTypeValue,
} from "@/lib/admin/event-constants";
import { COMMITTEE_PREFERENCES } from "@/lib/validations/auth";
import type { AdminEventRow } from "@/lib/admin/events";

const fieldClass =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

// <input type="datetime-local"> wants local time without a zone.
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type FormState = {
  title: string;
  description: string;
  location: string;
  when: string;
  type: EventTypeValue;
  committee: string;
  minutes: string;
};

function emptyForm(): FormState {
  return { title: "", description: "", location: "", when: "", type: "meeting", committee: "", minutes: "" };
}

function fromRow(e: AdminEventRow): FormState {
  return {
    title: e.title,
    description: e.description ?? "",
    location: e.location ?? "",
    when: toLocalInput(e.event_date),
    type: (e.event_type ?? "event") as EventTypeValue,
    committee: e.committee ?? "",
    minutes: e.minutes ?? "",
  };
}

export function EventsManager({
  upcoming,
  past,
}: {
  upcoming: AdminEventRow[];
  past: AdminEventRow[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminEventRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<AdminEventRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    const result = await deleteEvent(deleting.id);
    setDeleteBusy(false);
    if ("error" in result) {
      toast.add({ title: "Couldn't delete", description: result.error, type: "error" });
      return;
    }
    toast.add({ title: "Event deleted", type: "success" });
    setDeleting(null);
    router.refresh();
  }

  const card =
    "rounded-[13px] border border-[#e5edf6] bg-white p-5 shadow-[0_8px_28px_rgba(20,55,95,0.07)]";

  const row = (e: AdminEventRow) => (
    <div key={e.id} className="flex items-start justify-between gap-3 border-b border-[#F1F3F6] py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-tace-navy">{e.title}</span>
          {e.event_type ? (
            <span className="rounded-full bg-[#e8f6fd] px-2 py-0.5 text-[11px] font-bold text-tace-blue">
              {EVENT_TYPE_LABELS[e.event_type]}
            </span>
          ) : null}
          {e.committee ? (
            <span className="rounded-full bg-[#f4f1ff] px-2 py-0.5 text-[11px] font-bold text-[#7759e8]">
              {e.committee}
            </span>
          ) : null}
          {e.minutes ? (
            <span className="rounded-full bg-[#eaf8ef] px-2 py-0.5 text-[11px] font-bold text-tace-green">
              Minutes added
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-tace-gray">
          {e.event_date
            ? new Date(e.event_date).toLocaleString("en-NG", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })
            : "No date"}
        </p>
        {e.location ? (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-tace-gray/80">
            <MapPin className="size-3" />
            {e.location}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button size="icon" variant="ghost" aria-label={`Edit ${e.title}`} onClick={() => setEditing(e)} className="size-10">
          <Pencil className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label={`Delete ${e.title}`}
          onClick={() => setDeleting(e)}
          className="size-10 text-tace-red hover:bg-tace-red/10"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)} className="h-10">
          <Plus className="size-4" />
          New Event
        </Button>
      </div>

      <section className={card}>
        <h2 className="font-heading text-base font-semibold text-tace-navy">
          Upcoming ({upcoming.length})
        </h2>
        {upcoming.length > 0 ? (
          <div className="mt-2">{upcoming.map(row)}</div>
        ) : (
          <p className="mt-3 text-sm text-tace-gray/70">No upcoming events. Create one to get started.</p>
        )}
      </section>

      <section className={card}>
        <h2 className="font-heading text-base font-semibold text-tace-navy">
          Past ({past.length})
        </h2>
        <p className="mt-0.5 text-xs text-tace-gray/70">
          Add or edit the minutes of past meetings here. Members read them on their dashboard.
        </p>
        {past.length > 0 ? (
          <div className="mt-2">{past.map(row)}</div>
        ) : (
          <p className="mt-3 text-sm text-tace-gray/70">Nothing in the past yet.</p>
        )}
      </section>

      <EventDialog open={creating} onOpenChange={setCreating} mode="create" />
      <EventDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        mode="edit"
        event={editing}
      />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && !deleteBusy && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this event?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleting?.title}&rdquo; will be removed for everyone, along with any RSVPs and its minutes. This can&apos;t be undone.
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

function EventDialog({
  open,
  onOpenChange,
  mode,
  event,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  event?: AdminEventRow | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit() {
    setError(null);
    if (!form.when) {
      setError("Please choose a date and time.");
      return;
    }
    setSubmitting(true);
    const payload = {
      title: form.title,
      description: form.description,
      location: form.location,
      // The picker gives local time; send an unambiguous ISO timestamp.
      eventDate: new Date(form.when).toISOString(),
      eventType: form.type,
      committee: form.committee,
      minutes: form.minutes,
    };
    const result =
      mode === "create" ? await createEvent(payload) : await updateEvent(event!.id, payload);
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({ title: mode === "create" ? "Event created" : "Event updated", type: "success" });
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) {
          setForm(event ? fromRow(event) : emptyForm());
          setError(null);
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Event" : "Edit Event"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-tace-navy">
            Title
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Finance Committee monthly meeting" />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium text-tace-navy">
              Date and time
              <input type="datetime-local" value={form.when} onChange={(e) => set("when", e.target.value)} className={fieldClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-tace-navy">
              Type
              <select value={form.type} onChange={(e) => set("type", e.target.value as EventTypeValue)} className={fieldClass}>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {EVENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium text-tace-navy">
            Location <span className="text-xs font-normal text-tace-gray">(optional)</span>
            <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Online, or Foundation office" />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-tace-navy">
            Committee <span className="text-xs font-normal text-tace-gray">(optional)</span>
            <select value={form.committee} onChange={(e) => set("committee", e.target.value)} className={fieldClass}>
              <option value="">None — general event for everyone</option>
              {COMMITTEE_PREFERENCES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span className="text-xs font-normal text-tace-gray">
              Choose a committee for a committee meeting. It shows as that committee&apos;s &ldquo;next meeting&rdquo; for its members.
            </span>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-tace-navy">
            Description <span className="text-xs font-normal text-tace-gray">(optional)</span>
            <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} className={fieldClass} />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-tace-navy">
            Minutes <span className="text-xs font-normal text-tace-gray">(for past meetings)</span>
            <textarea rows={5} value={form.minutes} onChange={(e) => set("minutes", e.target.value)} className={fieldClass} />
          </label>

          {error ? (
            <p role="alert" className="text-sm text-tace-red">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !form.title.trim()}>
            {submitting ? "Saving..." : mode === "create" ? "Create event" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
