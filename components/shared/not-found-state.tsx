import Link from "next/link";

// A friendly "that page isn't here" screen with a way back.
export function NotFoundState({
  homeHref = "/",
  homeLabel = "Go to the home page",
}: {
  homeHref?: string;
  homeLabel?: string;
}) {
  return (
    <main className="mx-auto my-16 flex w-full max-w-md flex-1 flex-col items-center gap-4 p-8 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-[#e4f5ff] text-2xl" aria-hidden>
        🔍
      </span>
      <h1 className="font-heading text-2xl font-bold text-[#102a4d]">We can&apos;t find that page</h1>
      <p className="text-sm leading-relaxed text-[#4a607f]">
        The link may be old or mistyped. Nothing is wrong with your account.
      </p>
      <Link
        href={homeHref}
        className="inline-flex min-h-11 items-center rounded-lg bg-[#1597d1] px-5 text-sm font-semibold text-white hover:opacity-90"
      >
        {homeLabel}
      </Link>
    </main>
  );
}
