// Tells the server that a screen failed to render, so the real error can be
// matched in the server logs and the error tracker. It sends ONLY the error's
// digest (a hash Next.js creates), the page path without its query string, and
// which part of the site failed. Never the error message or stack, which can
// contain names, emails or message text.
export function reportClientError(error: { digest?: string }, scope: string) {
  try {
    const body = JSON.stringify({
      digest: error.digest ?? null,
      path: window.location.pathname,
      scope,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/client-error", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/client-error", {
        method: "POST",
        body,
        keepalive: true,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {
    /* reporting must never cause a second error */
  }
}
