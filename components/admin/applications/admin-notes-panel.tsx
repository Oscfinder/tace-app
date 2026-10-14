"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { saveAdminNotes } from "@/lib/admin/applications-actions";

export function AdminNotesPanel({
  applicationId,
  initialNotes,
}: {
  applicationId: string;
  initialNotes: string | null;
}) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [savedNotes, setSavedNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);

  const dirty = notes !== savedNotes;

  async function save() {
    if (!dirty) return;
    setSaving(true);
    const result = await saveAdminNotes(applicationId, notes);
    setSaving(false);
    if ("error" in result) {
      toast.add({
        title: "Couldn't save notes",
        description: result.error,
        type: "error",
      });
      return;
    }
    setSavedNotes(notes);
    toast.add({ title: "Notes saved", type: "success" });
  }

  return (
    <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-6">
      <h2 className="font-heading text-base font-semibold text-tace-navy">
        Admin Notes
      </h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={save}
        rows={4}
        placeholder="Internal notes about this application..."
        className="mt-3 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-tace-gray/70">
          {saving ? "Saving..." : dirty ? "Unsaved changes" : "Saved"}
        </span>
        <Button size="sm" variant="outline" onClick={save} disabled={!dirty}>
          Save Notes
        </Button>
      </div>
    </div>
  );
}
