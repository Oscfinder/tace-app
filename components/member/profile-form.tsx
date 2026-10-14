"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { updateMemberProfile } from "@/lib/member/actions";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function ProfileForm({
  fullName,
  phone,
  email,
  avatarUrl,
}: {
  fullName: string;
  phone: string;
  email: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [pending, startTransition] = useTransition();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Photo must be a JPG or PNG.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Photo must be under 2MB.");
      e.target.value = "";
      return;
    }
    setError(null);
    setPreview(URL.createObjectURL(file));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateMemberProfile(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      toast.add({ title: "Profile updated", type: "success" });
      router.refresh();
    });
  }

  const labelClass = "text-sm font-medium text-tace-navy";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex items-center gap-4">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Your profile photo"
            className="size-20 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            className="flex size-20 shrink-0 items-center justify-center rounded-full bg-tace-lgray text-2xl font-semibold text-tace-gray"
            aria-hidden
          >
            {fullName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="avatar" className={labelClass}>
            Profile photo
          </label>
          <input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFile}
            className="min-h-11 text-sm file:mr-3 file:min-h-11 file:rounded-lg file:border file:border-border file:bg-white file:px-3 file:text-sm"
          />
          <span className="text-xs text-tace-gray">JPG or PNG, up to 2MB.</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="full_name" className={labelClass}>
          Full name
        </label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={fullName}
          required
          autoComplete="name"
          className="h-11 text-base"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className={labelClass}>
          Phone
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={phone}
          autoComplete="tel"
          className="h-11 text-base"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <Input
          id="email"
          value={email}
          readOnly
          disabled
          className="h-11 text-base"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-tace-red">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full text-base sm:w-auto sm:self-start sm:px-6"
      >
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
