"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

export function StoryPhotoPicker({
  existingPhotoUrl,
  onFileSelected,
}: {
  existingPhotoUrl?: string | null;
  onFileSelected: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(
    existingPhotoUrl ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      onFileSelected(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPG or PNG photos are allowed.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Photo is larger than the 5MB limit.");
      e.target.value = "";
      return;
    }
    setError(null);
    setPreview(URL.createObjectURL(file));
    onFileSelected(file);
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
        Photo (optional)
      </label>
      {preview ? (
        <div className="relative mb-2.5 h-40 w-full overflow-hidden rounded-lg bg-tace-lgray">
          <Image
            src={preview}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : null}
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-4" />
        {preview ? "Replace Photo" : "Upload Photo"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleChange}
      />
      {error ? <p className="mt-1.5 text-sm text-tace-red">{error}</p> : null}
      <p className="mt-1.5 text-xs text-tace-gray/70">JPG or PNG — 5MB max.</p>
    </div>
  );
}
