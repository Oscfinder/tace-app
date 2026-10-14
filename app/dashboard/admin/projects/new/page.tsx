"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createProject } from "@/lib/admin/projects-actions";

export default function NewProjectPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const result = await createProject({
      title,
      description: description || null,
      targetAmount: targetAmount ? Number(targetAmount) : null,
      startDate: startDate || null,
      endDate: endDate || null,
    });
    // createProject redirects on success and never returns in that case.
    if (result && "error" in result) {
      setSubmitting(false);
      setError(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-6 pt-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-tace-navy">
          New Project
        </h1>
        <p className="mt-1 text-sm text-tace-gray">
          Saved as a draft — attach children and publish from the project page
          afterward.
        </p>
      </div>

      <div className="max-w-xl rounded-[14px] border border-[#ECEFF3] bg-white p-6">
        <div className="flex flex-col gap-3.5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
              Title
            </label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
              Target Amount (₦, optional)
            </label>
            <Input
              type="number"
              min="0"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          {error ? <p className="text-sm text-tace-red">{error}</p> : null}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !title.trim()}
            className="mt-2 self-start"
          >
            {submitting ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </div>
    </div>
  );
}
