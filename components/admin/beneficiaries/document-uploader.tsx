"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { uploadBeneficiaryDocument } from "@/lib/admin/beneficiaries-actions";
import type { BeneficiaryDocument } from "@/lib/admin/beneficiaries";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

const BUCKET_LABELS: Record<string, string> = {
  documents: "Documents",
  certificates: "Certificates",
};

export function DocumentUploader({
  beneficiaryId,
  documents,
}: {
  beneficiaryId: string;
  documents: BeneficiaryDocument[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bucket, setBucket] = useState<"documents" | "certificates">(
    "documents",
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, or PDF files are allowed.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File is larger than the 5MB limit.");
      return;
    }

    setError(null);
    setUploading(true);
    const formData = new FormData();
    formData.set("beneficiaryId", beneficiaryId);
    formData.set("bucket", bucket);
    formData.set("file", file);

    const result = await uploadBeneficiaryDocument(formData);
    setUploading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({ title: "File uploaded", type: "success" });
    router.refresh();
  }

  return (
    <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-6">
      <h2 className="font-heading text-base font-semibold text-tace-navy">
        Documents
      </h2>

      {documents.length > 0 ? (
        <div className="mt-4 flex flex-col">
          {documents.map((doc) => (
            <div
              key={`${doc.bucket}-${doc.path}`}
              className="flex items-center gap-3 border-b border-[#F1F3F6] py-2.5 last:border-b-0"
            >
              <FileText className="size-4 shrink-0 text-tace-gray" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-tace-navy">
                  {doc.name}
                </div>
                <div className="text-xs text-tace-gray/70">
                  {BUCKET_LABELS[doc.bucket]}
                </div>
              </div>
              {doc.signedUrl ? (
                <a
                  href={doc.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs font-bold text-tace-blue"
                >
                  Download
                </a>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-tace-gray/70">
          No documents uploaded yet.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <Select
          value={bucket}
          onValueChange={(v) =>
            v && setBucket(v as "documents" | "certificates")
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="documents">Documents</SelectItem>
            <SelectItem value="certificates">Certificates</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="size-4" />
          {uploading ? "Uploading..." : "Upload File"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {error ? <p className="mt-2 text-sm text-tace-red">{error}</p> : null}
      <p className="mt-2 text-xs text-tace-gray/70">
        JPG, PNG, or PDF only — 5MB max.
      </p>
    </div>
  );
}
