"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/monitoring/report-client-error";

// Last resort: used only when the root layout itself breaks. It replaces the
// whole page, so it brings its own <html>, <body> and styles.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    reportClientError(error, "global");
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f7faff", color: "#102a4d" }}>
        <main role="alert" style={{ maxWidth: 420, margin: "12vh auto", padding: 32, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, margin: "0 0 12px" }}>Something went wrong</h1>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: "#4a607f", margin: "0 0 24px" }}>
            We&apos;re sorry. That didn&apos;t work, and it is not your fault. Please try again.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              minHeight: 44,
              padding: "0 24px",
              borderRadius: 8,
              border: 0,
              background: "#1597d1",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest ? (
            <p style={{ fontSize: 12, color: "#7889a4", marginTop: 20 }}>Reference: {error.digest}</p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
