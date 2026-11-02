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
      scope="admin"
      homeHref="/dashboard/admin"
      homeLabel="Back to admin home"
    />
  );
}
