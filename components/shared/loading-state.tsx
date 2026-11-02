// Shown instantly while a page's data loads. Light on purpose: a few soft blocks
// that hint at the page, so a slow connection never shows a blank screen.
export function LoadingState({
  label = "Loading",
  tall = false,
}: {
  label?: string;
  /** Fill the screen, so a footer below does not jump up while this shows and then down when the page arrives. */
  tall?: boolean;
}) {
  return (
    <div role="status" aria-live="polite" className={`mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-8 ${tall ? "min-h-screen" : ""}`}>
      <span className="sr-only">{label}…</span>
      <div className="h-8 w-48 animate-pulse rounded-lg bg-[#e8eef6]" />
      <div className="h-4 w-72 max-w-full animate-pulse rounded bg-[#eef3f9]" />
      <div className="mt-2 grid gap-4 sm:grid-cols-2">
        <div className="h-28 animate-pulse rounded-2xl bg-[#eef3f9]" />
        <div className="h-28 animate-pulse rounded-2xl bg-[#eef3f9]" />
      </div>
      <div className="h-48 animate-pulse rounded-2xl bg-[#eef3f9]" />
    </div>
  );
}
