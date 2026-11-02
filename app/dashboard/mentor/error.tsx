"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <ErrorState
      error={error}
      retry={retry}
      scope="mentor"
      homeHref="/dashboard/mentor"
      homeLabel="Back to my home"
    />
  );
}
