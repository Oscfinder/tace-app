import { cn } from "@/lib/utils";

// Shared frame for the public content pages. The navigation bar is fixed over
// the top of the page, so the header band leaves room for it.
export function PageHeader({
  tag,
  title,
  subtitle,
}: {
  tag: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="bg-gradient-to-br from-tace-navy to-tace-blue-deep px-4 pb-14 pt-32 text-white md:px-8 md:pb-20 md:pt-40">
      <div className="mx-auto max-w-4xl">
        <span className="inline-flex rounded-full bg-tace-yellow/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-tace-yellow">
          {tag}
        </span>
        <h1 className="mt-4 font-heading text-3xl font-extrabold leading-tight md:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            {subtitle}
          </p>
        ) : null}
      </div>
    </header>
  );
}

export function PageBody({
  children,
  className,
  wide,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <main className="bg-white">
      <div className={cn("mx-auto px-4 py-12 md:px-8 md:py-16", wide ? "max-w-[1280px]" : "max-w-4xl", className)}>
        {children}
      </div>
    </main>
  );
}

// Long-form text (policies, stories): readable line length, clear headings.
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 text-base leading-relaxed text-tace-gray [&_a]:font-semibold [&_a]:text-tace-blue [&_a]:underline [&_h2]:mt-10 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-tace-navy [&_h3]:mt-6 [&_h3]:font-heading [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-tace-navy [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_strong]:text-tace-navy [&_ul]:space-y-2">
      {children}
    </div>
  );
}

// Shown at the top of each legal page until the trustees have signed it off.
// Remove the <DraftNotice /> lines once the legal trustee has approved the text.
export function DraftNotice() {
  return (
    <p className="mb-8 rounded-xl border border-tace-yellow/40 bg-tace-yellow/10 p-4 text-sm text-tace-navy">
      This page is being reviewed by our trustees and may be updated. If anything here is unclear, please write to us.
    </p>
  );
}
