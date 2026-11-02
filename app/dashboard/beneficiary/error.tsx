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
      scope="beneficiary"
      homeHref="/dashboard/beneficiary"
      homeLabel="Back to my home"
    />
  );
}
