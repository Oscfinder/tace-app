"use client";

import { useEffect, useRef, useState } from "react";

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 1200,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;

        const start = performance.now();
        function tick(now: number) {
          const progress = Math.min((now - start) / duration, 1);
          setDisplay(Math.round(progress * value));
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    // The final number is laid out invisibly in the same grid cell, so the box is
    // its full width from the first paint and the page does not jump while the
    // number counts up.
    <span ref={ref} className="inline-grid justify-items-center tabular-nums">
      <span aria-hidden className="invisible [grid-area:1/1]">
        {prefix}
        {value.toLocaleString()}
        {suffix}
      </span>
      <span className="[grid-area:1/1]">
        {prefix}
        {display.toLocaleString()}
        {suffix}
      </span>
    </span>
  );
}
