import { cn } from "@/lib/utils";

export function SectionHeading({
  tag,
  title,
  subtitle,
  center,
  dark,
  className,
}: {
  tag: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(center && "text-center", className)}>
      <span
        className={cn(
          "inline-flex items-center rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide",
          dark
            ? "bg-tace-yellow/15 text-tace-yellow"
            : "bg-tace-blue/10 text-tace-blue",
        )}
      >
        {tag}
      </span>
      <h2
        className={cn(
          "mt-4 font-heading text-3xl font-extrabold leading-tight md:text-[42px]",
          dark ? "text-white" : "text-tace-navy",
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            "mt-4 text-base font-medium leading-relaxed md:text-[17px]",
            dark ? "text-white/60" : "text-tace-gray",
            center && "mx-auto max-w-2xl",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
